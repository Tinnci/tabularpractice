"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Grid3X3 } from "lucide-react";
import type { CircuitDiagramConfig } from "./types";
import { COMPONENT_RENDERERS } from "./CircuitSymbols";
import { calculateConnectionPath } from "./CircuitRouteUtils";

export interface CircuitDiagramProps extends Omit<CircuitDiagramConfig, "type"> {
    height?: number;
    className?: string;
}

const GRID_SIZE = 20;

const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

/**
 * Circuit Diagram Visualization Component
 * Renders RLC circuit diagrams using custom SVG symbols.
 * Uses manual layout from data (validated by check-diagrams.ts).
 */
export function CircuitDiagram({
    components: initialComponents,
    connections,
    annotations,
    inputLabel,
    outputLabel,
    height = 300,
    className,
}: CircuitDiagramProps) {
    const [useGridSnap, setUseGridSnap] = useState(true);

    // Process components: optionally snap to grid
    const displayComponents = useMemo(() => {
        if (!useGridSnap) return initialComponents;

        return initialComponents.map(c => ({
            ...c,
            position: {
                x: snapToGrid(c.position.x),
                y: snapToGrid(c.position.y)
            }
        }));
    }, [initialComponents, useGridSnap]);

    // Calculate SVG viewBox based on component positions
    const viewBox = useMemo(() => {
        if (displayComponents.length === 0) return "0 0 400 200";

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        displayComponents.forEach(c => {
            minX = Math.min(minX, c.position.x);
            minY = Math.min(minY, c.position.y);
            maxX = Math.max(maxX, c.position.x);
            maxY = Math.max(maxY, c.position.y);
        });

        const padding = 80;
        const width = Math.max(400, maxX - minX + padding * 2);
        const svgHeight = Math.max(200, maxY - minY + padding * 2);

        return `${minX - padding} ${minY - padding} ${width} ${svgHeight}`;
    }, [displayComponents]);

    // Pre-calculate paths for connections to avoid recalculating on every render
    const connectionPaths = useMemo(() => {
        return connections.map((conn) => {
            const fromComp = displayComponents.find(c => c.id === conn.from);
            const toComp = displayComponents.find(c => c.id === conn.to);
            return calculateConnectionPath(conn, fromComp, toComp);
        });
    }, [connections, displayComponents]);

    return (
        <div
            className={cn("rounded-lg border bg-background overflow-hidden flex flex-col", className)}
            style={{ height }}
        >
            {/* Header / Toolbar */}
            <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span>电路图 / Circuit Diagram</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setUseGridSnap(!useGridSnap)}
                        className={cn(
                            "p-1.5 rounded-md transition-colors hover:bg-muted",
                            useGridSnap ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                        title="对齐网格 (Snap to Grid)"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 min-h-0">
                {/* SVG Container */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <svg
                        viewBox={viewBox}
                        className="w-full h-full text-slate-700 dark:text-slate-300"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Grid (optional) */}
                        <defs>
                            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.2" />
                            </pattern>
                        </defs>
                        {useGridSnap && <rect width="100%" height="100%" fill="url(#grid)" />}

                        {/* Connections (render first, under components) */}
                        <g className="connections">
                            {connections.map((conn, i) => (
                                <path
                                    key={`conn-${i}`}
                                    d={connectionPaths[i]}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={conn.style === "dashed" ? "5,5" : undefined}
                                    className="transition-all duration-300 ease-in-out"
                                />
                            ))}
                        </g>

                        {/* Components */}
                        <g className="components">
                            {displayComponents.map((comp) => {
                                const Renderer = COMPONENT_RENDERERS[comp.type];
                                if (!Renderer) {
                                    // Fallback: render as a box
                                    return (
                                        <g key={comp.id}>
                                            <rect
                                                x={comp.position.x - 20}
                                                y={comp.position.y - 15}
                                                width="40"
                                                height="30"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <text
                                                x={comp.position.x}
                                                y={comp.position.y + 5}
                                                textAnchor="middle"
                                                className="text-xs fill-current"
                                            >
                                                {comp.label || comp.type}
                                            </text>
                                        </g>
                                    );
                                }

                                return (
                                    <g key={comp.id} className="transition-all duration-300 ease-in-out">
                                        <Renderer
                                            x={comp.position.x}
                                            y={comp.position.y}
                                            rotation={comp.rotation}
                                            label={comp.label}
                                            value={comp.value}
                                        />
                                    </g>
                                );
                            })}
                        </g>

                        {/* Annotations */}
                        <g className="annotations text-blue-600 dark:text-blue-400">
                            {annotations?.map((ann, i) => (
                                <text
                                    key={`ann-${i}`}
                                    x={ann.x}
                                    y={ann.y}
                                    className="text-sm fill-current font-mono"
                                    textAnchor="middle"
                                >
                                    {ann.text}
                                </text>
                            ))}
                        </g>
                    </svg>
                </div>
            </div>

            {/* Footer / Legend */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                    {inputLabel && <span>输入: {inputLabel}</span>}
                    {outputLabel && <span>输出: {outputLabel}</span>}
                </div>
                <div>
                    {displayComponents.length > 0 && (
                        <span>
                            元件: {displayComponents.map(c => c.label || c.type).filter(Boolean).join(", ")}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
