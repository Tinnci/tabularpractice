/// <reference types="@webgpu/types" />
"use client";


import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { vertexShader } from './shaders';
import type { ReactSketchCanvasRef, ExportedPath } from '../types';
import { hexToRgba } from './utils';
import type { GpuSketchCanvasProps, GpuStroke } from './types';
import { updateGpuBuffer } from './buffer-manager';
import { useInteraction } from './useInteraction';
import { useWebGPU } from './useWebGPU';

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
        // GPU Resources managed by hook
        const {
            rootRef,
            drawPipelineRef,
            erasePipelineRef,
            pointBufferRef,
            uniformBufferRef,
            isReady
        } = useWebGPU(canvasRef);

        const strokesRef = useRef<GpuStroke[]>([]);
        const currentStrokeRef = useRef<GpuStroke | null>(null);
        const isDrawingRef = useRef(false);
        const rafRef = useRef<number | null>(null);
        const totalPointsRef = useRef(0);
        const isEraserRef = useRef(false);

        const draw = useCallback(() => {
            if (!rootRef.current || !drawPipelineRef.current || !erasePipelineRef.current || !canvasRef.current) return;

            const root = rootRef.current;
            const device = root.device as GPUDevice;
            const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
            if (!context) return;

            // 1. Update Uniform (Resolution)
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            // Use raw WebGPU write to ensure buffer is updated
            device.queue.writeBuffer(
                root.unwrap(uniformBufferRef.current),
                0,
                new Float32Array([width, height])
            );

            // 2. Prepare Draw
            const textureView = context.getCurrentTexture().createView();

            const allStrokes = [...strokesRef.current];
            if (currentStrokeRef.current) {
                allStrokes.push(currentStrokeRef.current);
            }

            if (allStrokes.length === 0) return;

            // Check pipeline type
            const isTypeGpuPipeline = 'with' in drawPipelineRef.current;

            if (isTypeGpuPipeline) {
                // --- TypeGPU Logic ---
                let isFirstDraw = true;
                for (const stroke of allStrokes) {
                    if (stroke.points.length === 0) continue;

                    const pipeline = stroke.isEraser ? erasePipelineRef.current : drawPipelineRef.current;

                    pipeline
                        .withColorAttachment({
                            view: textureView,
                            loadOp: isFirstDraw ? 'clear' : 'load',
                            storeOp: 'store',
                            clearValue: { r: 0, g: 0, b: 0, a: 0 }
                        })
                        .with(vertexShader.uniforms.canvas, uniformBufferRef.current)
                        .with(vertexShader.uniforms.points, pointBufferRef.current)
                        .draw(4, stroke.points.length, 0, stroke.startIndex);

                    isFirstDraw = false;
                }
            } else {
                // --- Standard WebGPU Fallback Logic ---
                const commandEncoder = device.createCommandEncoder();
                const renderPassDescriptor: GPURenderPassDescriptor = {
                    colorAttachments: [{
                        view: textureView,
                        clearValue: { r: 0, g: 0, b: 0, a: 0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                };

                const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

                // Create BindGroup (Assuming layout 0, bindings: 0=canvas, 1=points)
                // We assume drawPipeline and erasePipeline share the same layout (same shaders)
                const pipeline = drawPipelineRef.current as GPURenderPipeline;
                const bindGroupLayout = pipeline.getBindGroupLayout(0);

                const bindGroup = device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        { binding: 0, resource: { buffer: root.unwrap(uniformBufferRef.current) } },
                        { binding: 1, resource: { buffer: root.unwrap(pointBufferRef.current) } }
                    ]
                });

                for (const stroke of allStrokes) {
                    if (stroke.points.length === 0) continue;

                    const p = stroke.isEraser ? (erasePipelineRef.current as GPURenderPipeline) : (drawPipelineRef.current as GPURenderPipeline);

                    passEncoder.setPipeline(p);
                    passEncoder.setBindGroup(0, bindGroup);
                    // draw(vertexCount, instanceCount, firstVertex, firstInstance)
                    passEncoder.draw(4, stroke.points.length, 0, stroke.startIndex);
                }

                passEncoder.end();
                device.queue.submit([commandEncoder.finish()]);
            }
        }, [rootRef, drawPipelineRef, erasePipelineRef, pointBufferRef, uniformBufferRef]);

        const updateBuffer = useCallback((fullRebuild = false) => {
            if (!pointBufferRef.current || !rootRef.current) return;
            const device = rootRef.current.device as GPUDevice;
            const rawBuffer = rootRef.current.unwrap(pointBufferRef.current) as GPUBuffer;

            updateGpuBuffer({
                device,
                buffer: rawBuffer,
                strokes: strokesRef.current,
                currentStroke: currentStrokeRef.current,
                fullRebuild,
                totalPointsRef
            });
        }, [pointBufferRef, rootRef]);

        // Initial Draw when ready
        useEffect(() => {
            if (isReady) {
                draw();
            }
        }, [isReady, draw]);

        // Interaction Handlers
        // Interaction Handlers
        const rawPointsRef = useRef<{ x: number, y: number, p: number }[]>([]);

        const { handlePointerDown, handlePointerMove, handlePointerUp } = useInteraction({
            canvasRef,
            isDrawingRef,
            currentStrokeRef,
            strokesRef,
            rawPointsRef,
            totalPointsRef,
            isEraserRef,
            rafRef,
            allowOnlyPointerType,
            strokeColor,
            strokeWidth,
            onStroke,
            updateBuffer,
            draw
        });

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
            if (!canvasRef.current || !canvasRef.current.parentElement) return;

            const updateSize = () => {
                if (!canvasRef.current || !canvasRef.current.parentElement) return;
                const rect = canvasRef.current.parentElement.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // Only update if size actually changed to avoid unnecessary clears/redraws
                if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
                    canvasRef.current.width = rect.width * dpr;
                    canvasRef.current.height = rect.height * dpr;
                    draw();
                }
            };

            const resizeObserver = new ResizeObserver(() => {
                updateSize();
            });

            resizeObserver.observe(canvasRef.current.parentElement);

            // Initial size update
            updateSize();

            return () => {
                resizeObserver.disconnect();
            };
        }, [draw]);

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
