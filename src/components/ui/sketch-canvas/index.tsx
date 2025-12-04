"use client";

import React, {
    useState,
    useRef,
    useImperativeHandle,
    forwardRef,
    useEffect,
    useCallback
} from "react";
import { SvgPath } from "./SvgPath";
import {
    ReactSketchCanvasProps,
    ReactSketchCanvasRef,
    CanvasPath,
    Point,
    ExportedPath,
} from "./types";

function drawPathOnCanvas(ctx: CanvasRenderingContext2D, path: CanvasPath) {
    const points = path.paths;
    const len = points.length;
    if (len < 1) return;

    ctx.beginPath();
    const a = points[0];

    ctx.moveTo(a.x, a.y);

    if (len < 2) {
        // Draw a dot
        ctx.lineTo(a.x + 0.1, a.y + 0.1);
    } else {
        // Draw quadratic curves
        for (let i = 1; i < len - 1; i++) {
            const midX = (points[i].x + points[i + 1].x) / 2;
            const midY = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        // Connect the last point
        const last = points[len - 1];
        ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
}

const ReactSketchCanvas = forwardRef<ReactSketchCanvasRef, ReactSketchCanvasProps>(
    (
        {
            width = "100%",
            height = "100%",
            className = "",
            strokeColor = "#000000",
            canvasColor = "white",
            strokeWidth = 4,
            eraserWidth = 8,
            allowOnlyPointerType = "all",
            style,
            onStroke,
        },
        ref
    ) => {
        // --- State ---
        const [paths, setPaths] = useState<CanvasPath[]>([]);
        const [, setIsDrawing] = useState(false);

        // "Current Path" state - separated to avoid re-rendering all paths
        const [currentPath, setCurrentPath] = useState<CanvasPath | null>(null);

        // --- Refs ---
        const svgRef = useRef<SVGSVGElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const isDrawingRef = useRef(false);
        const currentPathRef = useRef<CanvasPath | null>(null);
        const isEraserModeRef = useRef(false);

        // For requestAnimationFrame throttling
        const pointsBuffer = useRef<Point[]>([]);
        const rafId = useRef<number | null>(null);

        // --- Helpers ---
        const getCoordinates = (e: React.PointerEvent): Point => {
            if (!svgRef.current) return { x: 0, y: 0 };
            const rect = svgRef.current.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        // --- Canvas Rendering ---
        const redraw = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            paths.forEach(path => {
                ctx.lineWidth = path.strokeWidth;
                ctx.strokeStyle = path.strokeColor;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                if (!path.drawMode) {
                    ctx.globalCompositeOperation = "destination-out";
                } else {
                    ctx.globalCompositeOperation = "source-over";
                }

                drawPathOnCanvas(ctx, path);
            });
        }, [paths]);

        // Handle Resize
        useEffect(() => {
            const canvas = canvasRef.current;
            const svg = svgRef.current;
            if (!canvas || !svg) return;

            const updateSize = () => {
                const rect = svg.getBoundingClientRect();
                // Only update if dimensions actually changed to avoid unnecessary redraws
                if (canvas.width !== rect.width || canvas.height !== rect.height) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                    redraw();
                }
            };

            updateSize();

            // Use ResizeObserver for more robust resizing
            const resizeObserver = new ResizeObserver(() => {
                updateSize();
            });
            resizeObserver.observe(svg);

            return () => resizeObserver.disconnect();
        }, [redraw]);

        // Redraw when paths change
        useEffect(() => {
            redraw();
        }, [redraw]);


        // --- Event Handlers ---

        const handlePointerDown = (e: React.PointerEvent) => {
            if (allowOnlyPointerType !== "all" && e.pointerType !== allowOnlyPointerType) {
                return;
            }

            // Capture pointer to ensure we receive events even if cursor leaves the SVG
            (e.target as Element).setPointerCapture(e.pointerId);

            const point = getCoordinates(e);
            const isEraser = isEraserModeRef.current;

            const newPath: CanvasPath = {
                paths: [point],
                strokeWidth: isEraser ? eraserWidth : strokeWidth,
                strokeColor: isEraser ? "#000000" : strokeColor,
                drawMode: !isEraser,
                startTimestamp: Date.now(),
            };

            isDrawingRef.current = true;
            currentPathRef.current = newPath;
            pointsBuffer.current = [point];

            setIsDrawing(true);
            setCurrentPath(newPath);
        };

        const handlePointerMove = (e: React.PointerEvent) => {
            if (!isDrawingRef.current || !currentPathRef.current) return;
            if (allowOnlyPointerType !== "all" && e.pointerType !== allowOnlyPointerType) return;

            const point = getCoordinates(e);
            pointsBuffer.current.push(point);

            // Throttle updates using requestAnimationFrame
            if (rafId.current === null) {
                rafId.current = requestAnimationFrame(() => {
                    if (currentPathRef.current) {
                        // Append buffered points to the current path ref
                        const newPoints = [...currentPathRef.current.paths, ...pointsBuffer.current];
                        currentPathRef.current.paths = newPoints;

                        // Update state to trigger re-render of ONLY the current path
                        setCurrentPath({ ...currentPathRef.current });

                        pointsBuffer.current = [];
                    }
                    rafId.current = null;
                });
            }
        };

        const handlePointerUp = (e: React.PointerEvent) => {
            if (!isDrawingRef.current) return;

            (e.target as Element).releasePointerCapture(e.pointerId);

            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }

            // Finalize the path
            if (currentPathRef.current) {
                const finalPath = {
                    ...currentPathRef.current,
                    endTimestamp: Date.now(),
                    // Ensure any remaining buffered points are included
                    paths: [...currentPathRef.current.paths, ...pointsBuffer.current]
                };

                // Add to history
                setPaths((prev) => [...prev, finalPath]);

                // Notify parent
                if (onStroke) {
                    // Convert to ExportedPath
                    const exported: ExportedPath = {
                        ...finalPath,
                        startTimestamp: finalPath.startTimestamp || 0,
                        endTimestamp: finalPath.endTimestamp || 0,
                    };
                    onStroke(exported, !finalPath.drawMode);
                }
            }

            // Reset state
            isDrawingRef.current = false;
            currentPathRef.current = null;
            pointsBuffer.current = [];
            setIsDrawing(false);
            setCurrentPath(null);
        };

        // --- Exposed Methods ---

        useImperativeHandle(ref, () => ({
            clearCanvas: () => {
                setPaths([]);
                setCurrentPath(null);
            },
            undo: () => {
                setPaths((prev) => prev.slice(0, -1));
            },
            eraseMode: (erase: boolean) => {
                isEraserModeRef.current = erase;
            },
            exportPaths: async () => {
                // Convert internal CanvasPath to ExportedPath
                return paths.map(p => ({
                    ...p,
                    startTimestamp: p.startTimestamp || 0,
                    endTimestamp: p.endTimestamp || 0,
                }));
            },
            loadPaths: (newPaths: ExportedPath[]) => {
                setPaths(newPaths.map(p => ({
                    ...p,
                    // Ensure compatibility
                    drawMode: p.drawMode ?? true
                })));
            },
            getSketchingTime: async () => {
                // Simple calculation
                return paths.reduce((acc, p) => acc + ((p.endTimestamp || 0) - (p.startTimestamp || 0)), 0);
            },
            resetCanvas: () => {
                setPaths([]);
                setCurrentPath(null);
            }
        }));

        // --- Rendering ---

        // We only render the CURRENT active path in SVG.
        // The history is rendered on the Canvas.

        const activeDrawPath = currentPath && currentPath.drawMode ? currentPath : null;
        const activeEraserPath = currentPath && !currentPath.drawMode ? currentPath : null;

        return (
            <div
                className={className}
                style={{
                    width,
                    height,
                    touchAction: "none", // Prevent scrolling while drawing
                    position: "relative",
                    ...style,
                }}
            >
                {/* Background Canvas for Rasterized Paths */}
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        background: canvasColor,
                        pointerEvents: "none" // Let events pass through to SVG
                    }}
                />

                {/* Foreground SVG for Active Interaction */}
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        // SVG background must be transparent to see canvas behind
                        background: "transparent"
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Active Drawing Path */}
                    {activeDrawPath && (
                        <SvgPath
                            points={activeDrawPath.paths}
                            strokeColor={activeDrawPath.strokeColor}
                            strokeWidth={activeDrawPath.strokeWidth}
                        />
                    )}

                    {/* Active Eraser Path (Simulated with canvasColor stroke) */}
                    {activeEraserPath && (
                        <SvgPath
                            points={activeEraserPath.paths}
                            strokeColor={canvasColor} // Simulate erasing by drawing with background color
                            strokeWidth={activeEraserPath.strokeWidth}
                        />
                    )}
                </svg>
            </div>
        );
    }
);

ReactSketchCanvas.displayName = "ReactSketchCanvas";

export { ReactSketchCanvas };
export type { ReactSketchCanvasRef };
