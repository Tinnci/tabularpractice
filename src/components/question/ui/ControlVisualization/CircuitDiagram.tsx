"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CircuitDiagramConfig } from "./types";
import { COMPONENT_RENDERERS } from "./CircuitSymbols";
import { calculateConnectionPath } from "./CircuitRouteUtils";

export interface CircuitDiagramProps extends Omit<CircuitDiagramConfig, "type"> {
    height?: number;
    className?: string;
}

const GRID_SIZE = 40;

/**
 * Circuit Diagram Visualization Component
 * Renders RLC circuit diagrams using custom SVG symbols
 */
export function CircuitDiagram({
    components,
    connections,
    annotations,
    inputLabel,
    outputLabel,
    height = 250,
    className,
}: CircuitDiagramProps) {
    // Calculate SVG viewBox based on component positions
    const viewBox = useMemo(() => {
        if (components.length === 0) return "0 0 400 200";

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        components.forEach(c => {
            minX = Math.min(minX, c.position.x);
            minY = Math.min(minY, c.position.y);
            maxX = Math.max(maxX, c.position.x);
            maxY = Math.max(maxY, c.position.y);
        });

        const padding = 60;
        const width = Math.max(400, maxX - minX + padding * 2);
        const svgHeight = Math.max(200, maxY - minY + padding * 2);

        return `${minX - padding} ${minY - padding} ${width} ${svgHeight}`;
    }, [components]);

    // Pre-calculate paths for connections to avoid recalculating on every render
    const connectionPaths = useMemo(() => {
        return connections.map((conn) => {
            const fromComp = components.find(c => c.id === conn.from);
            const toComp = components.find(c => c.id === conn.to);
            return calculateConnectionPath(conn, fromComp, toComp);
        });
    }, [connections, components]);

    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30 flex items-center justify-between">
                <span>电路图 / Circuit Diagram</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {inputLabel && <span>输入: {inputLabel}</span>}
                    {outputLabel && <span>输出: {outputLabel}</span>}
                </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                <svg
                    viewBox={viewBox}
                    className="w-full text-slate-700 dark:text-slate-300"
                    style={{ height, maxWidth: "100%" }}
                >
                    {/* Grid (optional) */}
                    <defs>
                        <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                            <circle cx="0" cy="0" r="1" fill="currentColor" opacity="0.15" />
                        </pattern>
                    </defs>

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
                                className="transition-all duration-300"
                            />
                        ))}
                    </g>

                    {/* Components */}
                    <g className="components">
                        {components.map((comp) => {
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
                                <Renderer
                                    key={comp.id}
                                    x={comp.position.x}
                                    y={comp.position.y}
                                    rotation={comp.rotation}
                                    label={comp.label}
                                    value={comp.value}
                                />
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
            {/* Legend */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1">
                {components.length > 0 && (
                    <span>
                        元件: {components.map(c => c.label || c.type).filter(Boolean).join(", ")}
                    </span>
                )}
            </div>
        </div>
    );
}
