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
    width: number;
    isEraser: boolean;
    startIndex: number; // In the global vertex buffer
}

// 最大点数限制 (用于预分配 Buffer)
const MAX_POINTS = 500000;

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
        const rootRef = useRef<any>(null);
        const drawPipelineRef = useRef<any>(null);
        const erasePipelineRef = useRef<any>(null);
        const vertexBufferRef = useRef<any>(null);
        const uniformBufferRef = useRef<any>(null);

        // State
        const strokesRef = useRef<GpuStroke[]>([]);
        const currentStrokeRef = useRef<GpuStroke | null>(null);
        const isDrawingRef = useRef(false);
        const rafRef = useRef<number | null>(null);
        const totalPointsRef = useRef(0);
        const isEraserRef = useRef(false);

        // Helper: Hex to RGBA
        const hexToRgba = (hex: string): [number, number, number, number] => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b, 1.0];
        };

        // Draw Function
        const draw = () => {
            if (!rootRef.current || !drawPipelineRef.current || !erasePipelineRef.current || !canvasRef.current) return;

            const device = rootRef.current.device as GPUDevice;
            const context = canvasRef.current.getContext('webgpu') as GPUCanvasContext;
            if (!context) return;

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

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            // Render all historical strokes + current stroke
            const allStrokes = [...strokesRef.current];
            if (currentStrokeRef.current) {
                allStrokes.push(currentStrokeRef.current);
            }

            for (const stroke of allStrokes) {
                if (stroke.points.length === 0) continue;

                // Update Uniforms for this stroke
                // Note: In a highly optimized app, we might use a dynamic uniform buffer or instance data for colors.
                // For now, writing to the uniform buffer per stroke is acceptable for < 1000 strokes.
                uniformBufferRef.current.write({
                    resolution: [width, height],
                    brushColor: stroke.color,
                    brushSize: stroke.width,
                });

                // Select Pipeline
                const pipeline = stroke.isEraser ? erasePipelineRef.current : drawPipelineRef.current;

                // Draw
                // We assume the vertex buffer is already populated with all points in order.
                // stroke.startIndex tells us where this stroke's points begin.
                pipeline.draw(4, stroke.points.length, 0, stroke.startIndex, renderPass);
            }

            renderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        };

        // Update Vertex Buffer
        // This function rebuilds the ENTIRE vertex buffer or appends to it.
        // For simplicity in this iteration, we'll append the current stroke's new points
        // or rebuild if necessary (e.g. undo/clear).
        const updateBuffer = (fullRebuild = false) => {
            if (!vertexBufferRef.current || !rootRef.current) return;
            const device = rootRef.current.device as GPUDevice;
            const rawBuffer = rootRef.current.unwrap(vertexBufferRef.current) as GPUBuffer;

            if (fullRebuild) {
                // Rebuild everything from strokesRef
                let offset = 0;
                const data = new Float32Array(MAX_POINTS * 4); // Pre-allocate max

                let currentTotal = 0;

                const processStroke = (stroke: GpuStroke) => {
                    stroke.startIndex = currentTotal;
                    for (let i = 0; i < stroke.points.length; i++) {
                        const p = stroke.points[i];
                        data[offset++] = p.x;
                        data[offset++] = p.y;
                        data[offset++] = p.p;
                        data[offset++] = 0; // padding
                    }
                    currentTotal += stroke.points.length;
                };

                strokesRef.current.forEach(processStroke);
                if (currentStrokeRef.current) processStroke(currentStrokeRef.current);

                totalPointsRef.current = currentTotal;

                // Write only the used portion
                if (currentTotal > 0) {
                    device.queue.writeBuffer(rawBuffer, 0, data, 0, currentTotal * 4);
                }
            } else {
                // Append mode (for drawing)
                // We assume strokesRef is already in buffer, we just need to add currentStrokeRef's NEW points.
                // Actually, for simplicity and robustness against race conditions, 
                // let's just write the CURRENT stroke's data to its specific slot.

                const stroke = currentStrokeRef.current;
                if (!stroke) return;

                // If it's a new stroke, startIndex might need setting
                if (stroke.startIndex === -1) {
                    stroke.startIndex = totalPointsRef.current;
                }

                // Calculate where to write
                // We write the WHOLE current stroke every frame (or optimized: just the new points).
                // Let's write the whole current stroke for safety.
                const startIdx = stroke.startIndex;
                const count = stroke.points.length;

                if (startIdx + count > MAX_POINTS) {
                    // Buffer overflow protection
                    return;
                }

                const data = new Float32Array(count * 4);
                for (let i = 0; i < count; i++) {
                    const p = stroke.points[i];
                    data[i * 4 + 0] = p.x;
                    data[i * 4 + 1] = p.y;
                    data[i * 4 + 2] = p.p;
                    data[i * 4 + 3] = 0;
                }

                device.queue.writeBuffer(rawBuffer, startIdx * 16, data); // 16 bytes per point
            }
        };

        // Init WebGPU
        useEffect(() => {
            const initGpu = async () => {
                if (!canvasRef.current || !navigator.gpu) return;
                const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
                if (!context) return;

                const root = await tgpu.init();
                rootRef.current = root;

                // Buffers
                const PointsArray = d.arrayOf(StrokePoint, MAX_POINTS);
                const vertexBuffer = root.createBuffer(PointsArray).$usage('vertex');
                vertexBufferRef.current = vertexBuffer;

                const uniformBuffer = root.createBuffer(CanvasUniforms).$usage('uniform');
                uniformBufferRef.current = uniformBuffer;

                // Pipelines
                const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                context.configure({
                    device: root.device as GPUDevice,
                    format: presentationFormat,
                    alphaMode: 'premultiplied',
                });

                const unstable = root['~unstable'] as any;

                // Common pipeline config
                const pipelineConfig = {
                    vertex: vertexShader,
                    fragment: fragmentShader,
                    primitive: { topology: 'triangle-strip', stripIndexFormat: undefined },
                };

                // Draw Pipeline (Alpha Blending)
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
                    .with(vertexShader.in.instance, vertexBuffer);

                // Erase Pipeline (Dst Out / Clear)
                // We use 'dst-out' to subtract alpha. 
                // srcFactor: 'zero', dstFactor: 'one-minus-src-alpha' -> Result = Dst * (1 - SrcAlpha)
                // If SrcAlpha is 1 (brush), Dst becomes 0 (transparent).
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
                    .with(vertexShader.in.instance, vertexBuffer);

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

            // Start new stroke
            currentStrokeRef.current = {
                points: [{ x, y, p }],
                color: hexToRgba(strokeColor),
                width: strokeWidth,
                isEraser: isEraserRef.current,
                startIndex: totalPointsRef.current // Start at the end of existing points
            };

            updateBuffer(false); // Append
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
                    updateBuffer(false); // Append
                    draw();
                    rafRef.current = null;
                });
            }
        };

        const handlePointerUp = (e: React.PointerEvent) => {
            if (!isDrawingRef.current || !currentStrokeRef.current) return;
            isDrawingRef.current = false;
            (e.target as Element).releasePointerCapture(e.pointerId);

            // Finalize stroke
            const stroke = currentStrokeRef.current;
            strokesRef.current.push(stroke);
            totalPointsRef.current += stroke.points.length;
            currentStrokeRef.current = null;

            if (onStroke) {
                const exportedPath: ExportedPath = {
                    paths: stroke.points.map(p => ({ x: p.x, y: p.y })),
                    strokeWidth: stroke.width,
                    strokeColor: strokeColor, // Note: storing the original hex might be better if we want to restore it exactly
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
                    strokeColor: "#000000", // TODO: Reverse RGBA to Hex or store Hex in stroke
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
