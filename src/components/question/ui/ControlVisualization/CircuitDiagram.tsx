"use client";

/**
 * SemanticCircuitDiagram Component
 * 
 * A next-generation circuit diagram renderer that uses:
 * - Semantic data format (roles, constraints, no manual coordinates)
 * - ELK layout engine for optimal positioning
 * - Automatic orthogonal routing
 * 
 * This replaces the manual-coordinate approach with an intelligent
 * constraint-based layout system.
 */

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { SemanticCircuitConfig } from "./semantic-circuit-types";
import type { CircuitComponent, CircuitConnection } from "./types";
import { computeCircuitLayout } from "./circuit-layout-engine";
import { COMPONENT_RENDERERS } from "./CircuitSymbols";
import { calculateConnectionPath } from "./CircuitRouteUtils";

export interface CircuitDiagramProps {
    config: SemanticCircuitConfig;
    height?: number;
    className?: string;
}

interface LayoutState {
    components: CircuitComponent[];
    connections: CircuitConnection[];
    isLoading: boolean;
    error: string | null;
}

const GRID_SIZE = 20;

/**
 * CircuitDiagram - ELK-powered circuit visualization
 */
export function CircuitDiagram({
    config,
    height = 300,
    className,
}: CircuitDiagramProps) {
    // Initialize with loading state
    const [layout, setLayout] = useState<LayoutState>(() => ({
        components: [],
        connections: [],
        isLoading: true,
        error: null,
    }));

    // Compute layout when config changes
    useEffect(() => {
        let cancelled = false;

        // Use async function inside effect
        async function performLayout() {
            try {
                const result = await computeCircuitLayout(config);
                if (!cancelled) {
                    setLayout({
                        components: result.components,
                        connections: result.connections,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Circuit layout error:", err);
                    setLayout({
                        components: [],
                        connections: [],
                        isLoading: false,
                        error: (err as Error).message || "Layout failed",
                    });
                }
            }
        }

        performLayout();

        return () => { cancelled = true; };
    }, [config]);

    // Calculate SVG viewBox
    const viewBox = useMemo(() => {
        if (layout.components.length === 0) return "0 0 400 200";

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        layout.components.forEach(c => {
            minX = Math.min(minX, c.position.x);
            minY = Math.min(minY, c.position.y);
            maxX = Math.max(maxX, c.position.x);
            maxY = Math.max(maxY, c.position.y);
        });

        const padding = 80;
        const width = Math.max(400, maxX - minX + padding * 2);
        const svgHeight = Math.max(200, maxY - minY + padding * 2);

        return `${minX - padding} ${minY - padding} ${width} ${svgHeight}`;
    }, [layout.components]);

    // Pre-calculate connection paths
    const connectionPaths = useMemo(() => {
        return layout.connections.map((conn) => {
            return calculateConnectionPath(conn);
        });
    }, [layout.connections]);

    // Loading state
    if (layout.isLoading) {
        return (
            <div
                className={cn("rounded-lg border bg-background flex items-center justify-center", className)}
                style={{ height }}
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Computing layout...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (layout.error) {
        return (
            <div
                className={cn("rounded-lg border bg-destructive/10 flex items-center justify-center", className)}
                style={{ height }}
            >
                <div className="text-destructive text-sm">
                    Layout error: {layout.error}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("rounded-lg border bg-background overflow-hidden flex flex-col", className)}
            style={{ height }}
        >
            {/* Header */}
            <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span>电路图 / Circuit Diagram</span>
                    <span className="text-xs text-muted-foreground">(ELK Auto-Layout)</span>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 min-h-0">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <svg
                        viewBox={viewBox}
                        className="w-full h-full text-slate-700 dark:text-slate-300"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Grid pattern */}
                        <defs>
                            <pattern id="semantic-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.15" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#semantic-grid)" />

                        {/* Connections */}
                        <g className="connections">
                            {layout.connections.map((conn, i) => (
                                <path
                                    key={`conn-${i}`}
                                    d={connectionPaths[i]}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={conn.style === "dashed" ? "5,5" : undefined}
                                />
                            ))}
                        </g>

                        {/* Components */}
                        <g className="components">
                            {layout.components.map((comp) => {
                                const Renderer = COMPONENT_RENDERERS[comp.type];
                                if (!Renderer) {
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
                                    <g key={comp.id}>
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
                            {config.annotations?.map((ann, i) => {
                                // Calculate position based on annotation type
                                let x = ann.x ?? 0;
                                let y = ann.y ?? 0;

                                if (ann.position === "output" && layout.components.length > 0) {
                                    const outputComp = layout.components.find(
                                        c => config.components.find(sc => sc.id === c.id)?.role === "output"
                                    );
                                    if (outputComp) {
                                        x = outputComp.position.x + 40;
                                        y = outputComp.position.y - 5;
                                    }
                                } else if (ann.position === "custom" && ann.x === 0 && ann.y === 0) {
                                    // Auto-calculate for output label
                                    const outputComp = layout.components.find(
                                        c => config.components.find(sc => sc.id === c.id)?.role === "output"
                                    );
                                    if (outputComp) {
                                        x = outputComp.position.x + 40;
                                        y = outputComp.position.y - 5;
                                    }
                                }

                                return (
                                    <text
                                        key={`ann-${i}`}
                                        x={x}
                                        y={y}
                                        className="text-sm fill-current font-mono"
                                        textAnchor="start"
                                    >
                                        {ann.text}
                                    </text>
                                );
                            })}
                        </g>
                    </svg>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                    {config.inputLabel && <span>输入: {config.inputLabel}</span>}
                    {config.outputLabel && <span>输出: {config.outputLabel}</span>}
                </div>
                <div>
                    {layout.components.length > 0 && (
                        <span>
                            元件: {layout.components.map(c => c.label || c.type).filter(Boolean).join(", ")}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
