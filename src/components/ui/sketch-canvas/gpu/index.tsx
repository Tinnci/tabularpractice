/// <reference types="@webgpu/types" />
"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { CanvasUniforms, StrokePoint, vertexShader, fragmentShader } from './shaders';
import { ReactSketchCanvasRef, ExportedPath } from '../types';

interface GpuSketchCanvasProps {
    width?: string;
    height?: string;
    className?: string;
    strokeColor?: string;
    strokeWidth?: number;
    canvasColor?: string;
    allowOnlyPointerType?: 'all' | 'mouse' | 'touch' | 'pen';
    onStroke?: (path: ExportedPath, isEraser: boolean) => void;
}

// 最大点数限制 (用于预分配 Buffer)
const MAX_POINTS = 100000;

const GpuSketchCanvas = forwardRef<ReactSketchCanvasRef, GpuSketchCanvasProps>(
    ({
        width = "100%",
        height = "100%",
        className = "",
        strokeColor = "#000000",
        strokeWidth = 4,
        allowOnlyPointerType = "all",
        onStroke
    }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const rootRef = useRef<any>(null); // TgpuRoot
        const pipelineRef = useRef<any>(null); // RenderPipeline
        const vertexBufferRef = useRef<any>(null); // TgpuBuffer
        const uniformBufferRef = useRef<any>(null); // TgpuBuffer

        // 本地状态管理
        const pointsRef = useRef<{ x: number, y: number, p: number }[]>([]);
        const isDrawingRef = useRef(false);
        const rafRef = useRef<number | null>(null);

        // 颜色转换 Hex -> RGBA [0-1]
        const hexToRgba = (hex: string): [number, number, number, number] => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b, 1.0];
        };

        // 绘制循环
        const draw = () => {
            if (!rootRef.current || !pipelineRef.current || !canvasRef.current) return;

            const device = rootRef.current.device as GPUDevice;
            const context = canvasRef.current.getContext('webgpu') as GPUCanvasContext;
            if (!context) return;

            // 1. 更新 Uniforms
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const rgba = hexToRgba(strokeColor);

            uniformBufferRef.current.write({
                resolution: [width, height],
                brushColor: rgba,
                brushSize: strokeWidth,
            });

            // 2. 更新 Vertex Buffer (Instance Data)
            // 这是一个昂贵的操作，实际生产中应该使用 Ring Buffer 或只上传新增部分
            // 这里为了演示，全量上传 (TypeGPU 的 write 会处理序列化)
            const pointsData = pointsRef.current.map(p => ({
                position: [p.x, p.y],
                pressure: p.p
            }));

            // 如果点数超过 MAX_POINTS，截断
            const safePoints = pointsData.slice(0, MAX_POINTS);

            // 3. 提交绘制命令
            const commandEncoder = device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();

            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: textureView,
                    clearValue: { r: 0, g: 0, b: 0, a: 0 }, // 透明背景
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });

            if (safePoints.length > 0) {
                // 使用 TypeGPU 的 pipeline 绘制
                // draw(vertexCount, instanceCount, firstVertex, firstInstance)
                // 每个点是一个 Instance，画一个 Quad (4个顶点)
                pipelineRef.current.draw(4, safePoints.length, 0, 0, renderPass);
            }

            renderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        };

        const updateBufferAndDraw = () => {
            if (!vertexBufferRef.current) return;

            // 优化：直接写入 Raw Buffer
            const points = pointsRef.current;
            const count = points.length;
            if (count === 0) return;

            // StrokePoint 结构: [pos(2*4), pressure(4)] = 12 bytes
            // 但 WebGPU struct alignment 可能是 16 bytes (vec2 + float + padding)
            const structSize = 16; // 保守估计
            // const bufferSize = count * structSize;
            const data = new Float32Array(count * 4); // 4 floats per point

            for (let i = 0; i < count; i++) {
                data[i * 4 + 0] = points[i].x;
                data[i * 4 + 1] = points[i].y;
                data[i * 4 + 2] = points[i].p;
                data[i * 4 + 3] = 0; // Padding
            }

            // 使用 device.queue.writeBuffer
            const device = rootRef.current.device as GPUDevice;
            const rawBuffer = rootRef.current.unwrap(vertexBufferRef.current) as GPUBuffer;

            // 注意：这里我们假设 rawBuffer 足够大。
            // 如果点数超过初始分配，WebGPU 会报错。
            // 生产环境需要动态 resize buffer。
            if (count <= MAX_POINTS) {
                device.queue.writeBuffer(rawBuffer, 0, data);
            }

            draw();
        };

        // 初始化 WebGPU
        useEffect(() => {
            const initGpu = async () => {
                if (!canvasRef.current) return;

                // 1. 初始化 Root
                if (!navigator.gpu) {
                    console.error("WebGPU not supported");
                    return;
                }

                const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
                if (!context) {
                    console.error("Failed to get WebGPU context");
                    return;
                }

                const root = await tgpu.init();
                rootRef.current = root;

                // 2. 创建 Buffers
                // Vertex Buffer (Instance Data): 预分配大数组
                const PointsArray = d.arrayOf(StrokePoint, MAX_POINTS);
                const vertexBuffer = root
                    .createBuffer(PointsArray)
                    .$usage('vertex'); // Removed 'copy_dst'

                vertexBufferRef.current = vertexBuffer;

                // Uniform Buffer
                const uniformBuffer = root
                    .createBuffer(CanvasUniforms)
                    .$usage('uniform'); // Removed 'copy_dst'

                uniformBufferRef.current = uniformBuffer;

                // 3. 创建 Render Pipeline
                const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                context.configure({
                    device: root.device as GPUDevice,
                    format: presentationFormat,
                    alphaMode: 'premultiplied',
                });

                const unstable = root['~unstable'] as any;
                const pipeline = unstable.createRenderPipeline({
                    vertex: vertexShader,
                    fragment: fragmentShader,
                    primitive: {
                        topology: 'triangle-strip', // 使用 Triangle Strip 绘制 Quad
                        stripIndexFormat: undefined,
                    },
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            // 简单的 Alpha Blending
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add',
                            },
                        },
                    }],
                })
                    // 绑定资源
                    .with(vertexShader.uniforms.canvas, uniformBuffer)
                    .with(vertexShader.in.instance, vertexBuffer); // 绑定 Instance Buffer

                pipelineRef.current = pipeline;

                // 初始绘制
                draw();
            };

            initGpu();

            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // 交互处理
        const handlePointerDown = (e: React.PointerEvent) => {
            if (allowOnlyPointerType !== 'all' && e.pointerType !== allowOnlyPointerType) return;

            (e.target as Element).setPointerCapture(e.pointerId);
            isDrawingRef.current = true;

            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const p = e.pressure || 0.5; // 默认压力

            pointsRef.current.push({ x, y, p });

            // 触发一次更新
            updateBufferAndDraw();
        };

        const handlePointerMove = (e: React.PointerEvent) => {
            if (!isDrawingRef.current) return;

            // 获取 Coalesced Events (高频采样)
            const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
            const rect = canvasRef.current!.getBoundingClientRect();

            for (const ev of events) {
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                const p = ev.pressure || 0.5;
                pointsRef.current.push({ x, y, p });
            }

            // 使用 requestAnimationFrame 节流绘制
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(() => {
                    updateBufferAndDraw();
                    rafRef.current = null;
                });
            }
        };

        const handlePointerUp = (e: React.PointerEvent) => {
            if (!isDrawingRef.current) return;
            isDrawingRef.current = false;
            (e.target as Element).releasePointerCapture(e.pointerId);

            // 触发保存
            if (onStroke) {
                // 模拟 ExportedPath
                onStroke({
                    paths: pointsRef.current.map(p => ({ x: p.x, y: p.y })),
                    strokeWidth,
                    strokeColor,
                    drawMode: true,
                    startTimestamp: Date.now(),
                    endTimestamp: Date.now()
                }, false);
            }
        };

        // 暴露 Ref 方法
        useImperativeHandle(ref, () => ({
            clearCanvas: () => {
                pointsRef.current = [];
                updateBufferAndDraw();
            },
            undo: () => {
                // 简单实现：移除最后 10 个点？
                pointsRef.current.pop();
                updateBufferAndDraw();
            },
            eraseMode: () => { }, // GPU 版暂未实现橡皮擦
            exportPaths: async () => [],
            loadPaths: () => { },
            getSketchingTime: async () => 0,
            resetCanvas: () => {
                pointsRef.current = [];
                updateBufferAndDraw();
            }
        }));

        // 监听 Resize
        useEffect(() => {
            const handleResize = () => {
                if (canvasRef.current) {
                    const parent = canvasRef.current.parentElement;
                    if (parent) {
                        canvasRef.current.width = parent.clientWidth;
                        canvasRef.current.height = parent.clientHeight;
                        draw();
                    }
                }
            };
            window.addEventListener('resize', handleResize);
            handleResize(); // Initial size
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        return (
            <div className={className} style={{ width, height, position: 'relative', touchAction: 'none' }}>
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </div>
        );
    }
);

GpuSketchCanvas.displayName = "GpuSketchCanvas";

export { GpuSketchCanvas };
