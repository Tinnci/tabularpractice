import { useCallback, RefObject, MutableRefObject } from 'react';
import type { GpuStroke, ExportedPath, GpuSketchCanvasProps, Point } from './types';
import { hexToRgba } from './utils';

interface UseInteractionParams {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    isDrawingRef: MutableRefObject<boolean>;
    currentStrokeRef: MutableRefObject<GpuStroke | null>;
    strokesRef: MutableRefObject<GpuStroke[]>;
    rawPointsRef: MutableRefObject<Point[]>;
    totalPointsRef: MutableRefObject<number>;
    isEraserRef: MutableRefObject<boolean>;
    rafRef: MutableRefObject<number | null>;

    // Props
    allowOnlyPointerType: GpuSketchCanvasProps['allowOnlyPointerType'];
    strokeColor: string;
    strokeWidth: number;
    onStroke?: (path: ExportedPath, isEraser: boolean) => void;

    // Callbacks
    updateBuffer: (fullRebuild?: boolean) => void;
    draw: () => void;
}

export function useInteraction({
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
}: UseInteractionParams) {

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (allowOnlyPointerType && allowOnlyPointerType !== 'all' && e.pointerType !== allowOnlyPointerType) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        isDrawingRef.current = true;

        const rect = canvasRef.current!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        const p = e.pressure || 0.5;

        // Initialize raw points buffer
        rawPointsRef.current = [{ x, y, p }];

        currentStrokeRef.current = {
            points: [{ x, y, p }],
            color: hexToRgba(strokeColor),
            hexColor: strokeColor,
            width: strokeWidth * dpr,
            isEraser: isEraserRef.current,
            startIndex: totalPointsRef.current
        };

        updateBuffer(false);
        draw();
    }, [allowOnlyPointerType, strokeColor, strokeWidth, updateBuffer, draw, canvasRef, currentStrokeRef, isDrawingRef, isEraserRef, rawPointsRef, totalPointsRef]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDrawingRef.current || !currentStrokeRef.current) return;

        const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
        const rect = canvasRef.current!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const stroke = currentStrokeRef.current;
        const rawPoints = rawPointsRef.current;

        for (const ev of events) {
            const x = (ev.clientX - rect.left) * dpr;
            const y = (ev.clientY - rect.top) * dpr;
            const p = ev.pressure || 0.5;

            // Filter out points that are too close to the last one to prevent stacking artifacts
            if (rawPoints.length > 0) {
                const last = rawPoints[rawPoints.length - 1];
                const dist = Math.hypot(x - last.x, y - last.y);
                if (dist < 1) continue; // Ignore points closer than 1px
            }

            rawPoints.push({ x, y, p });

            // We need at least 3 points to form a quadratic bezier segment
            if (rawPoints.length > 2) {
                const i = rawPoints.length - 2;
                const p0 = rawPoints[i - 1];
                const p1 = rawPoints[i];
                const p2 = rawPoints[i + 1];

                // Calculate midpoints
                const mid1 = {
                    x: (p0.x + p1.x) / 2,
                    y: (p0.y + p1.y) / 2,
                    p: (p0.p + p1.p) / 2
                };
                const mid2 = {
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2,
                    p: (p1.p + p2.p) / 2
                };

                // Interpolate Quadratic Bezier from mid1 to mid2 with control p1
                const dist = Math.hypot(mid2.x - mid1.x, mid2.y - mid1.y);
                const brushSize = stroke.width;
                const step = Math.max(1, brushSize / 4);
                const numSteps = Math.ceil(dist / step);

                for (let tStep = 1; tStep <= numSteps; tStep++) {
                    const t = tStep / numSteps;
                    const a = Math.pow(1 - t, 2);
                    const b = 2 * (1 - t) * t;
                    const c = Math.pow(t, 2);

                    const bx = a * mid1.x + b * p1.x + c * mid2.x;
                    const by = a * mid1.y + b * p1.y + c * mid2.y;
                    const bp = a * mid1.p + b * p1.p + c * mid2.p;

                    stroke.points.push({ x: bx, y: by, p: bp });
                }
            } else if (rawPoints.length === 2) {
                // Linear interpolate the very beginning to reduce latency
                const p0 = rawPoints[0];
                const p1 = rawPoints[1];
                const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
                const step = Math.max(1, stroke.width / 4);
                const numSteps = Math.ceil(dist / step);
                for (let i = 1; i <= numSteps; i++) {
                    const t = i / numSteps;
                    stroke.points.push({
                        x: p0.x + (p1.x - p0.x) * t,
                        y: p0.y + (p1.y - p0.y) * t,
                        p: p0.p + (p1.p - p0.p) * t
                    });
                }
            }
        }

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
                updateBuffer(false);
                draw();
                rafRef.current = null;
            });
        }
    }, [updateBuffer, draw, canvasRef, currentStrokeRef, isDrawingRef, rafRef, rawPointsRef]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDrawingRef.current || !currentStrokeRef.current) return;
        isDrawingRef.current = false;
        (e.target as Element).releasePointerCapture(e.pointerId);

        const stroke = currentStrokeRef.current;
        const rawPoints = rawPointsRef.current;

        // Finalize the stroke: draw the tail from the last midpoint to the actual end
        if (rawPoints.length > 2) {
            const last = rawPoints[rawPoints.length - 1];
            const secondLast = rawPoints[rawPoints.length - 2];

            // The main loop stops at mid(secondLast, last). We need to finish the line to 'last'.
            const startX = (secondLast.x + last.x) / 2;
            const startY = (secondLast.y + last.y) / 2;
            const startP = (secondLast.p + last.p) / 2;

            const endX = last.x;
            const endY = last.y;
            const endP = last.p;

            const dist = Math.hypot(endX - startX, endY - startY);
            const step = Math.max(1, stroke.width / 4);
            const numSteps = Math.ceil(dist / step);

            for (let i = 1; i <= numSteps; i++) {
                const t = i / numSteps;
                stroke.points.push({
                    x: startX + (endX - startX) * t,
                    y: startY + (endY - startY) * t,
                    p: startP + (endP - startP) * t
                });
            }
        }

        // Ensure the last points are written to the buffer
        updateBuffer(false);

        strokesRef.current.push(stroke);
        totalPointsRef.current += stroke.points.length;
        currentStrokeRef.current = null;

        // Final draw to ensure everything is up to date
        draw();

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
    }, [onStroke, updateBuffer, draw, currentStrokeRef, isDrawingRef, rawPointsRef, strokesRef, totalPointsRef]);

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    };
}
