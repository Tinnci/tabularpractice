"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CircuitDiagramConfig, CircuitComponent, CircuitConnection } from "./types";

interface CircuitDiagramProps extends Omit<CircuitDiagramConfig, "type"> {
    height?: number;
    className?: string;
}

// =============== SVG Circuit Component Symbols ===============

interface SymbolProps {
    x: number;
    y: number;
    rotation?: number;
    label?: string;
    value?: string;
}

const GRID_SIZE = 40; // Grid unit for positioning

/** Resistor Symbol (zigzag) */
function ResistorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Zigzag resistor */}
            <path
                d="M-30,0 L-20,0 L-15,-8 L-5,8 L5,-8 L15,8 L20,0 L30,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-15"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Capacitor Symbol (two parallel lines) */
function CapacitorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Left wire */}
            <line x1="-30" y1="0" x2="-5" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Left plate */}
            <line x1="-5" y1="-12" x2="-5" y2="12" stroke="currentColor" strokeWidth="2" />
            {/* Right plate */}
            <line x1="5" y1="-12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" />
            {/* Right wire */}
            <line x1="5" y1="0" x2="30" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-18"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Inductor Symbol (coils) */
function InductorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Coil arcs */}
            <path
                d="M-30,0 L-25,0 
                   A5,5 0 0 1 -15,0 
                   A5,5 0 0 1 -5,0 
                   A5,5 0 0 1 5,0 
                   A5,5 0 0 1 15,0 
                   A5,5 0 0 1 25,0 
                   L30,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-15"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Voltage Source Symbol (circle with + -) */
function VoltageSourceSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Circle */}
            <circle cx="0" cy="0" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Plus sign */}
            <line x1="-5" y1="-5" x2="5" y2="-5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="-10" x2="0" y2="0" stroke="currentColor" strokeWidth="1.5" />
            {/* Minus sign */}
            <line x1="-5" y1="5" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5" />
            {/* Wires */}
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="0" x2="30" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-25"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Ground Symbol */
function GroundSymbol({ x, y, rotation = 0 }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            <line x1="0" y1="-15" x2="0" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-8" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="-4" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="2" />
        </g>
    );
}

/** Wire/Node point */
function NodeSymbol({ x, y }: SymbolProps) {
    return (
        <circle cx={x} cy={y} r="3" fill="currentColor" />
    );
}

// Component renderer map
const COMPONENT_RENDERERS: Record<string, React.FC<SymbolProps>> = {
    resistor: ResistorSymbol,
    capacitor: CapacitorSymbol,
    inductor: InductorSymbol,
    "voltage-source": VoltageSourceSymbol,
    ground: GroundSymbol,
    node: NodeSymbol,
};

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

    // Render connections as SVG paths
    const renderConnections = () => {
        return connections.map((conn, i) => {
            const fromComp = components.find(c => c.id === conn.from);
            const toComp = components.find(c => c.id === conn.to);

            if (!fromComp || !toComp) return null;

            // Calculate connection points (simplified: center to center)
            const x1 = fromComp.position.x + 30; // Offset for component width
            const y1 = fromComp.position.y;
            const x2 = toComp.position.x - 30;
            const y2 = toComp.position.y;

            // Use bend points if provided
            if (conn.bendPoints && conn.bendPoints.length > 0) {
                const pathParts = [`M${x1},${y1}`];
                conn.bendPoints.forEach(bp => {
                    pathParts.push(`L${bp.x},${bp.y}`);
                });
                pathParts.push(`L${x2},${y2}`);

                return (
                    <path
                        key={`conn-${i}`}
                        d={pathParts.join(" ")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={conn.style === "dashed" ? "5,5" : undefined}
                    />
                );
            }

            // Simple straight or L-shaped connection
            if (Math.abs(y1 - y2) < 5) {
                // Horizontal
                return (
                    <line
                        key={`conn-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                );
            } else {
                // L-shaped
                const midX = (x1 + x2) / 2;
                return (
                    <path
                        key={`conn-${i}`}
                        d={`M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                );
            }
        });
    };

    // Render components
    const renderComponents = () => {
        return components.map((comp) => {
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
        });
    };

    // Render annotations
    const renderAnnotations = () => {
        return annotations?.map((ann, i) => (
            <text
                key={`ann-${i}`}
                x={ann.x}
                y={ann.y}
                className="text-sm fill-current font-mono"
                textAnchor="middle"
            >
                {ann.text}
            </text>
        ));
    };

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
                        {renderConnections()}
                    </g>

                    {/* Components */}
                    <g className="components">
                        {renderComponents()}
                    </g>

                    {/* Annotations */}
                    <g className="annotations text-blue-600 dark:text-blue-400">
                        {renderAnnotations()}
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
