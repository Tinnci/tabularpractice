/// <reference types="@webgpu/types" />
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
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

        const draw = () => {
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

                // Debug logging
                console.log('[GPU Debug] Writing buffer:', {
                    startIndex: startIdx,
                    pointsCount: count,
                    firstPointData: Array.from(data.slice(0, 8)), // x, y, p, size, r, g, b, a
                    bufferOffset: startIdx * 32
                });

                device.queue.writeBuffer(rawBuffer, startIdx * 32, data);
            }
        };

        useEffect(() => {
            const initGpu = async () => {
                if (!canvasRef.current || !navigator.gpu) return;
                const context = canvasRef.current.getContext('webgpu') as unknown as GPUCanvasContext;
                if (!context) return;

                // Ensure canvas size is correct before init
                const rect = canvasRef.current.getBoundingClientRect();
                canvasRef.current.width = rect.width;
                canvasRef.current.height = rect.height;

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
