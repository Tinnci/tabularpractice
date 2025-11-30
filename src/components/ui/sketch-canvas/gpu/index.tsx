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

        // Storage Buffer
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

        const draw = () => {
            if (!rootRef.current || !drawPipelineRef.current || !erasePipelineRef.current || !canvasRef.current) return;

            const device = rootRef.current.device as GPUDevice;
            const context = canvasRef.current.getContext('webgpu') as GPUCanvasContext;
            if (!context) return;

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            uniformBufferRef.current.write({
                resolution: [width, height],
            });

            const commandEncoder = device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();

            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: textureView,
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });

            const allStrokes = [...strokesRef.current];
            if (currentStrokeRef.current) {
                allStrokes.push(currentStrokeRef.current);
            }

            for (const stroke of allStrokes) {
                if (stroke.points.length === 0) continue;

                const pipeline = stroke.isEraser ? erasePipelineRef.current : drawPipelineRef.current;

                // Draw 逻辑不变：instanceIndex 会自动传递给 shader
                // shader 中的 input.instanceIndex 将会是 (0 + startIndex) 到 (length + startIndex)
                pipeline.draw(4, stroke.points.length, 0, stroke.startIndex, renderPass);
            }

            renderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        };

        const updateBuffer = (fullRebuild = false) => {
            if (!pointBufferRef.current || !rootRef.current) return;
            const device = rootRef.current.device as GPUDevice;
            // 获取原始 buffer
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

                // 修改 1: 创建 Buffer 时标记为 'storage'
                // 注意：WebGPU 中 Storage Buffer 通常需要 4字节对齐，Stride 为 32 符合要求
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
                    primitive: { topology: 'triangle-strip', stripIndexFormat: undefined },
                };

                // 修改 2: 绑定方式改变
                // 之前是 .with(vertexShader.in.instance, vertexBuffer)
                // 现在是 .with(vertexShader.uniforms.points, pointBuffer)

                const drawPipeline = unstable.createRenderPipeline({
                    ...pipelineConfig,
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        },
                    }],
                })
                    .with(vertexShader.uniforms.canvas, uniformBuffer)
                    .with(vertexShader.uniforms.points, pointBuffer); // 绑定 Storage Buffer

                const erasePipeline = unstable.createRenderPipeline({
                    ...pipelineConfig,
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            color: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        },
                    }],
                })
                    .with(vertexShader.uniforms.canvas, uniformBuffer)
                    .with(vertexShader.uniforms.points, pointBuffer); // 绑定 Storage Buffer

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
                        updateBuffer(true); // Rebuild buffer without the last stroke
                        draw();
                    }
                }
            },
            eraseMode: (erase: boolean) => {
                isEraserRef.current = erase;
            },
            exportPaths: async () => {
                // Convert internal strokes to ExportedPath[]
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
                // Convert ExportedPath[] to internal strokes
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
