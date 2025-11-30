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

interface GpuStroke {
    points: { x: number, y: number, p: number }[];
    color: [number, number, number, number];
    hexColor: string;
    width: number;
    isEraser: boolean;
    startIndex: number;
}

const MAX_POINTS = 500000;
const FLOATS_PER_POINT = 8;

const GpuSketchCanvas = forwardRef<ReactSketchCanvasRef, GpuSketchCanvasProps>(
    (props, ref) => {
        const {
            width = "100%",
            height = "100%",
            className = "",
            strokeColor = "#000000",
            strokeWidth = 4,
            allowOnlyPointerType = "all",
            onStroke
        } = props;

        const canvasRef = useRef<HTMLCanvasElement>(null);
        const rootRef = useRef<any>(null);
        const drawPipelineRef = useRef<any>(null);
        const erasePipelineRef = useRef<any>(null);

        const pointBufferRef = useRef<any>(null);
        const uniformBufferRef = useRef<any>(null);

        const strokesRef = useRef<GpuStroke[]>([]);
        const currentStrokeRef = useRef<GpuStroke | null>(null);
        const isDrawingRef = useRef(false);
        const rafRef = useRef<number | null>(null);
        const totalPointsRef = useRef(0);
        const isEraserRef = useRef(false);

        const hexToRgba = (hex: string): [number, number, number, number] => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b, 1.0];
        };

        // --- 核心修改：Draw 函数 ---
        const draw = () => {
            if (!rootRef.current || !drawPipelineRef.current || !erasePipelineRef.current || !canvasRef.current) return;

            const context = canvasRef.current.getContext('webgpu') as GPUCanvasContext;
            if (!context) return;

            // 1. 更新 Uniform (分辨率)
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            uniformBufferRef.current.write({ resolution: [width, height] });

            // 2. 准备绘制
            const textureView = context.getCurrentTexture().createView();

            // 收集所有需要绘制的笔画
            const allStrokes = [...strokesRef.current];
            if (currentStrokeRef.current) {
                allStrokes.push(currentStrokeRef.current);
            }

            // 3. 循环绘制
            // 注意：因为我们要多次通过 pipeline.draw 绘制到同一个 texture，
            // 第一笔需要 clear，后面的需要 load (保留上一笔)
            let isFirstDraw = true;

            // 如果没有笔画，我们需要清空屏幕
            if (allStrokes.length === 0) {
                // 这里可以使用一个空的 Pass 或者简单的 clear，
                // 但为了简单起见，利用 TypeGPU 的机制，我们可以不做操作，或者强制 draw 一个空的
                // 实际上，WebGPU Canvas 默认每帧会 clear。如果什么都不做，就是透明/黑色。
                return;
            }

            for (const stroke of allStrokes) {
                if (stroke.points.length === 0) continue;

                const pipeline = stroke.isEraser ? erasePipelineRef.current : drawPipelineRef.current;

                // 使用 TypeGPU 的 Fluent API
                pipeline
                    .withColorAttachment({
                        view: textureView,
                        // 第一笔清除，后续保留
                        loadOp: isFirstDraw ? 'clear' : 'load',
                        storeOp: 'store',
                        clearValue: { r: 0, g: 0, b: 0, a: 0 } // 透明背景
                    })
                    // 绑定资源
                    .with(vertexShader.uniforms.canvas, uniformBufferRef.current)
                    .with(vertexShader.uniforms.points, pointBufferRef.current)
                    // 执行绘制
                    // draw(vertexCount, instanceCount, firstVertex, firstInstance)
                    .draw(4, stroke.points.length, 0, stroke.startIndex);

                isFirstDraw = false;
            }
        };

        const updateBuffer = (fullRebuild = false) => {
            if (!pointBufferRef.current || !rootRef.current) return;
            const device = rootRef.current.device as GPUDevice;
            const rawBuffer = rootRef.current.unwrap(pointBufferRef.current) as GPUBuffer;

            const writeStrokeToData = (stroke: GpuStroke, targetData: Float32Array, startOffset: number) => {
                let offset = startOffset;
                for (let i = 0; i < stroke.points.length; i++) {
                    const p = stroke.points[i];
                    targetData[offset++] = p.x;
                    targetData[offset++] = p.y;
                    targetData[offset++] = p.p;
                    targetData[offset++] = stroke.width;
                    targetData[offset++] = stroke.color[0];
                    targetData[offset++] = stroke.color[1];
                    targetData[offset++] = stroke.color[2];
                    targetData[offset++] = stroke.color[3];
                }
                return offset;
            };

            if (fullRebuild) {
                const data = new Float32Array(MAX_POINTS * FLOATS_PER_POINT);
                let currentTotal = 0;
                let offset = 0;
                const processStroke = (stroke: GpuStroke) => {
                    stroke.startIndex = currentTotal;
                    offset = writeStrokeToData(stroke, data, offset);
                    currentTotal += stroke.points.length;
                };
                strokesRef.current.forEach(processStroke);
                if (currentStrokeRef.current) processStroke(currentStrokeRef.current);
                totalPointsRef.current = currentTotal;

                if (currentTotal > 0) {
                    device.queue.writeBuffer(rawBuffer, 0, data, 0, currentTotal * FLOATS_PER_POINT * 4);
                }
            } else {
                const stroke = currentStrokeRef.current;
                if (!stroke) return;
                if (stroke.startIndex === -1) stroke.startIndex = totalPointsRef.current;

                const startIdx = stroke.startIndex;
                const count = stroke.points.length;
                if (startIdx + count > MAX_POINTS) return;

                const data = new Float32Array(count * FLOATS_PER_POINT);
                writeStrokeToData(stroke, data, 0);

                device.queue.writeBuffer(rawBuffer, startIdx * 32, data);
            }
        };

        useEffect(() => {
            const initGpu = async () => {
                if (!canvasRef.current || !navigator.gpu) return;
                const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
                if (!context) return;

                const root = await tgpu.init();
                rootRef.current = root;

                // 创建 Buffer，标记为 Storage
                const PointsArray = d.arrayOf(StrokePoint, MAX_POINTS);
                const pointBuffer = root.createBuffer(PointsArray).$usage('storage');
                pointBufferRef.current = pointBuffer;

                const uniformBuffer = root.createBuffer(CanvasUniforms).$usage('uniform');
                uniformBufferRef.current = uniformBuffer;

                const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                context.configure({
                    device: root.device as GPUDevice,
                    format: presentationFormat,
                    alphaMode: 'premultiplied',
                });

                const unstable = root['~unstable'] as any;

                const pipelineConfig = {
                    vertex: vertexShader,
                    fragment: fragmentShader,
                    // 关键：关闭剔除，或者确保顶点顺序正确。这里关闭剔除最安全。
                    primitive: {
                        topology: 'triangle-strip',
                        stripIndexFormat: undefined,
                        cullMode: 'none'
                    },
                };

                // 创建 Pipeline，不在这里绑定 .with()，而在 draw 时动态绑定
                const drawPipeline = unstable.createRenderPipeline({
                    ...pipelineConfig,
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        },
                    }],
                });

                const erasePipeline = unstable.createRenderPipeline({
                    ...pipelineConfig,
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            color: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        },
                    }],
                });

                drawPipelineRef.current = drawPipeline;
                erasePipelineRef.current = erasePipeline;

                draw();
            };

            initGpu();

            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }, []);

        // Interaction Handlers
        const handlePointerDown = (e: React.PointerEvent) => {
            if (allowOnlyPointerType !== 'all' && e.pointerType !== allowOnlyPointerType) return;
            (e.target as Element).setPointerCapture(e.pointerId);
            isDrawingRef.current = true;

            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const p = e.pressure || 0.5;

            currentStrokeRef.current = {
                points: [{ x, y, p }],
                color: hexToRgba(strokeColor),
                hexColor: strokeColor,
                width: strokeWidth,
                isEraser: isEraserRef.current,
                startIndex: totalPointsRef.current
            };

            updateBuffer(false);
            draw();
        };

        const handlePointerMove = (e: React.PointerEvent) => {
            if (!isDrawingRef.current || !currentStrokeRef.current) return;

            const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
            const rect = canvasRef.current!.getBoundingClientRect();

            for (const ev of events) {
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                const p = ev.pressure || 0.5;
                currentStrokeRef.current.points.push({ x, y, p });
            }

            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(() => {
                    updateBuffer(false);
                    draw();
                    rafRef.current = null;
                });
            }
        };

        const handlePointerUp = (e: React.PointerEvent) => {
            if (!isDrawingRef.current || !currentStrokeRef.current) return;
            isDrawingRef.current = false;
            (e.target as Element).releasePointerCapture(e.pointerId);

            const stroke = currentStrokeRef.current;
            strokesRef.current.push(stroke);
            totalPointsRef.current += stroke.points.length;
            currentStrokeRef.current = null;

            if (onStroke) {
                const exportedPath: ExportedPath = {
                    paths: stroke.points.map(p => ({ x: p.x, y: p.y })),
                    strokeWidth: stroke.width,
                    strokeColor: stroke.hexColor,
                    drawMode: !stroke.isEraser,
                    startTimestamp: Date.now(),
                    endTimestamp: Date.now()
                };
                onStroke(exportedPath, stroke.isEraser);
            }
        };

        // Imperative Handle
        useImperativeHandle(ref, () => ({
            clearCanvas: () => {
                strokesRef.current = [];
                currentStrokeRef.current = null;
                totalPointsRef.current = 0;
                updateBuffer(true); // Full clear
                draw();
            },
            undo: () => {
                if (strokesRef.current.length > 0) {
                    const removed = strokesRef.current.pop();
                    if (removed) {
                        totalPointsRef.current -= removed.points.length;
                        updateBuffer(true);
                        draw();
                    }
                }
            },
            eraseMode: (erase: boolean) => {
                isEraserRef.current = erase;
            },
            exportPaths: async () => {
                return strokesRef.current.map(s => ({
                    paths: s.points.map(p => ({ x: p.x, y: p.y })),
                    strokeWidth: s.width,
                    strokeColor: s.hexColor,
                    drawMode: !s.isEraser,
                    startTimestamp: 0,
                    endTimestamp: 0
                }));
            },
            loadPaths: (paths: ExportedPath[]) => {
                let currentTotal = 0;
                const newStrokes: GpuStroke[] = paths.map(p => {
                    const stroke: GpuStroke = {
                        points: p.paths.map(pt => ({ x: pt.x, y: pt.y, p: 0.5 })),
                        color: hexToRgba(p.strokeColor),
                        hexColor: p.strokeColor,
                        width: p.strokeWidth,
                        isEraser: !p.drawMode,
                        startIndex: currentTotal
                    };
                    currentTotal += stroke.points.length;
                    return stroke;
                });

                strokesRef.current = newStrokes;
                totalPointsRef.current = currentTotal;
                updateBuffer(true);
                draw();
            },
            getSketchingTime: async () => 0,
            resetCanvas: () => {
                strokesRef.current = [];
                totalPointsRef.current = 0;
                updateBuffer(true);
                draw();
            }
        }));

        // Resize
        useEffect(() => {
            const handleResize = () => {
                if (canvasRef.current && canvasRef.current.parentElement) {
                    canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                    canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                    draw();
                }
            };
            window.addEventListener('resize', handleResize);
            handleResize();
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
