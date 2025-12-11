/// <reference types="@webgpu/types" />
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { CanvasUniforms, StrokePoint, vertexShader, fragmentShader } from './shaders';
import type { ReactSketchCanvasRef, ExportedPath } from '../types';
import { hexToRgba } from './utils';
import type { GpuSketchCanvasProps, GpuStroke } from './types';
import { MAX_POINTS } from './types';
import { updateGpuBuffer } from './buffer-manager';
import { useInteraction } from './useInteraction';

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
        }, []);

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
        }, []);

        useEffect(() => {
            const initGpu = async () => {
                if (!canvasRef.current || !navigator.gpu) return;
                const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
                if (!context) return;

                // Ensure canvas size is correct before init
                const rect = canvasRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = rect.width * dpr;
                canvasRef.current.height = rect.height * dpr;

                const root = await tgpu.init();
                rootRef.current = root;
                const device = root.device as GPUDevice;

                // 1. Global Error Listener
                device.addEventListener('uncapturederror', (event) => {
                    const e = event as GPUUncapturedErrorEvent;
                    console.error('[WebGPU Error]', e.error.message);
                    console.error(e.error);
                });

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
                    primitive: {
                        topology: 'triangle-strip',
                        stripIndexFormat: undefined,
                        cullMode: 'none'
                    },
                };

                // Fallback to standard WebGPU if createRenderPipeline is missing
                const createRenderPipeline = unstable?.createRenderPipeline || (root as any).createRenderPipeline;

                if (!createRenderPipeline) {
                    console.warn('[GPU] createRenderPipeline not found, falling back to standard WebGPU with hardcoded WGSL');

                    // Hardcoded WGSL to bypass tgpu.resolve errors
                    const WGSL_CODE = `
                        struct CanvasUniforms {
                            resolution: vec2f,
                        }

                        struct StrokePoint {
                            position: vec2f,
                            pressure: f32,
                            size: f32,
                            color: vec4f,
                        }

                        @group(0) @binding(0) var<uniform> canvas: CanvasUniforms;
                        @group(0) @binding(1) var<storage, read> points: array<StrokePoint>;

                        struct VertexOutput {
                            @builtin(position) pos: vec4f,
                            @location(0) uv: vec2f,
                            @location(1) color: vec4f,
                        }

                        @vertex
                        fn vs_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
                            let point = points[instanceIndex];
                            
                            var x = -1.0;
                            var y = -1.0;
                            if (vertexIndex == 1u) { x = 1.0; }
                            if (vertexIndex == 2u) { y = 1.0; }
                            if (vertexIndex == 3u) { x = 1.0; y = 1.0; }
                            
                            let quadPos = vec2f(x, y);
                            let size = point.size * max(point.pressure, 0.1);
                            let offset = quadPos * size;
                            let pixelPos = point.position + offset;
                            
                            // Convert to NDC
                            // WebGPU NDC: X [-1, 1], Y [-1, 1] (Y is up in NDC, but screen Y is down)
                            // We need to map screen (0,0) top-left to NDC (-1, 1) top-left.
                            // Screen X: 0 -> -1, W -> 1 => (x / W) * 2 - 1
                            // Screen Y: 0 -> 1, H -> -1 => (1 - y / H) * 2 - 1
                            
                            let ndcX = (pixelPos.x / canvas.resolution.x) * 2.0 - 1.0;
                            let ndcY = (1.0 - (pixelPos.y / canvas.resolution.y)) * 2.0 - 1.0;
                            
                            var out: VertexOutput;
                            out.pos = vec4f(ndcX, ndcY, 0.0, 1.0);
                            out.uv = quadPos;
                            out.color = point.color;
                            return out;
                        }

                        @fragment
                        fn fs_main(@location(0) uv: vec2f, @location(1) color: vec4f) -> @location(0) vec4f {
                            let dist = length(uv);
                            if (dist > 1.0) {
                                discard;
                            }
                            let alpha = 1.0 - smoothstep(0.8, 1.0, dist);
                            return vec4f(color.rgb, color.a * alpha);
                        }
                    `;

                    const shaderModule = device.createShaderModule({ code: WGSL_CODE });

                    // 2. Create Pipelines
                    const pipelineDescriptor: GPURenderPipelineDescriptor = {
                        layout: 'auto',
                        vertex: {
                            module: shaderModule,
                            entryPoint: 'vs_main',
                        },
                        fragment: {
                            module: shaderModule,
                            entryPoint: 'fs_main',
                            targets: [{
                                format: presentationFormat,
                                blend: {
                                    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                },
                            }],
                        },
                        primitive: {
                            topology: 'triangle-strip',
                            cullMode: 'none',
                        },
                    };

                    const drawPipeline = device.createRenderPipeline(pipelineDescriptor);

                    const erasePipelineDescriptor: GPURenderPipelineDescriptor = {
                        ...pipelineDescriptor,
                        fragment: {
                            ...pipelineDescriptor.fragment!,
                            targets: [{
                                format: presentationFormat,
                                blend: {
                                    color: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                    alpha: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                                },
                            }],
                        }
                    };

                    const erasePipeline = device.createRenderPipeline(erasePipelineDescriptor);

                    drawPipelineRef.current = drawPipeline;
                    erasePipelineRef.current = erasePipeline;
                    draw();
                    return;
                }

                const drawPipeline = createRenderPipeline({
                    ...pipelineConfig,
                    targets: [{
                        format: presentationFormat,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        },
                    }],
                });

                const erasePipeline = createRenderPipeline({
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
                // eslint-disable-next-line react-hooks/exhaustive-deps
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }, [draw]);

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
