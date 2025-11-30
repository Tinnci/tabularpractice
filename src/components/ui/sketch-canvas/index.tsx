"use client";

import React, {
    useState,
    useRef,
    useImperativeHandle,
    forwardRef,
    useId,
} from "react";
import { SvgPath } from "./SvgPath";
import {
    ReactSketchCanvasProps,
    ReactSketchCanvasRef,
    CanvasPath,
    Point,
    ExportedPath,
} from "./types";

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
                strokeColor: isEraser ? "#000000" : strokeColor, // Eraser uses mask, color doesn't matter much but #000000 for mask
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

        const drawPaths = paths.filter(p => p.drawMode);
        const eraserPaths = paths.filter(p => !p.drawMode);

        // Also consider the current path
        const activeDrawPath = currentPath && currentPath.drawMode ? currentPath : null;
        const activeEraserPath = currentPath && !currentPath.drawMode ? currentPath : null;

        const id = useId();
        const maskId = `react-sketch-canvas-mask-${id}`;

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
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{ display: "block", background: canvasColor }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <defs>
                        <mask id={maskId}>
                            {/* White fills everything (reveal) */}
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {/* Black strokes hide (erase) */}
                            {eraserPaths.map((path, i) => (
                                <SvgPath
                                    key={`erase-${i}`}
                                    points={path.paths}
                                    strokeColor="black"
                                    strokeWidth={path.strokeWidth}
                                />
                            ))}
                            {activeEraserPath && (
                                <SvgPath
                                    points={activeEraserPath.paths}
                                    strokeColor="black"
                                    strokeWidth={activeEraserPath.strokeWidth}
                                />
                            )}
                        </mask>
                    </defs>

                    {/* Group for Drawings, with Mask applied */}
                    <g mask={`url(#${maskId})`}>
                        {drawPaths.map((path, i) => (
                            <SvgPath
                                key={`draw-${i}`}
                                points={path.paths}
                                strokeColor={path.strokeColor}
                                strokeWidth={path.strokeWidth}
                            />
                        ))}
                        {activeDrawPath && (
                            <SvgPath
                                points={activeDrawPath.paths}
                                strokeColor={activeDrawPath.strokeColor}
                                strokeWidth={activeDrawPath.strokeWidth}
                            />
                        )}
                    </g>
                </svg>
            </div>
        );
    }
);

ReactSketchCanvas.displayName = "ReactSketchCanvas";

export { ReactSketchCanvas };
export type { ReactSketchCanvasRef };
