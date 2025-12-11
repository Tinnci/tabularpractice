/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { CanvasUniforms, StrokePoint, vertexShader, fragmentShader } from './shaders';
import { MAX_POINTS } from './types';
import { FALLBACK_WGSL } from './fallback-shaders';

interface UseWebGPUResult {
    rootRef: React.MutableRefObject<any>;
    drawPipelineRef: React.MutableRefObject<any>;
    erasePipelineRef: React.MutableRefObject<any>;
    pointBufferRef: React.MutableRefObject<any>;
    uniformBufferRef: React.MutableRefObject<any>;
    isReady: boolean;
}

export function useWebGPU(canvasRef: React.RefObject<HTMLCanvasElement | null>): UseWebGPUResult {
    const rootRef = useRef<any>(null);
    const drawPipelineRef = useRef<any>(null);
    const erasePipelineRef = useRef<any>(null);
    const pointBufferRef = useRef<any>(null);
    const uniformBufferRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

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

            // Create Buffer, marked as Storage
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
                    topology: 'triangle-strip' as const,
                    stripIndexFormat: undefined,
                    cullMode: 'none' as const
                },
            };

            // Fallback to standard WebGPU if createRenderPipeline is missing
            const createRenderPipeline = unstable?.createRenderPipeline || (root as any).createRenderPipeline;

            if (!createRenderPipeline) {
                console.warn('[GPU] createRenderPipeline not found, falling back to standard WebGPU with hardcoded WGSL');

                const shaderModule = device.createShaderModule({ code: FALLBACK_WGSL });

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
            } else {
                // TypeGPU Pipeline Creation
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
            }

            setIsReady(true);
        };

        initGpu();
    }, [canvasRef]);

    return {
        rootRef,
        drawPipelineRef,
        erasePipelineRef,
        pointBufferRef,
        uniformBufferRef,
        isReady
    };
}
