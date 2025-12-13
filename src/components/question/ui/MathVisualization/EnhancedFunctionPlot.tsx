"use client";

/**
 * Enhanced Function Plot Component
 * 
 * Features:
 * - Multiple functions overlay
 * - Critical points marking (extrema, inflection points)
 * - Asymptotes visualization
 * - Area shading (for definite integrals)
 * - Interactive controls
 * - Theme-aware styling
 */

import { Mafs, Coordinates, Plot, Point, Text, Line, Theme, Polygon, vec } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";
import { useMemo, useState, useCallback } from "react";
import { Viz2DControls, ZoomIndicator } from "./Viz2DControls";

// ============== Types ==============

export interface FunctionConfig {
    /** Function expression or function */
    expr: string | ((x: number) => number);
    /** Display color */
    color?: string;
    /** Label for legend */
    label?: string;
    /** Line style */
    style?: "solid" | "dashed";
    /** Line opacity (0-1) */
    opacity?: number;
}

export interface CriticalPointConfig {
    x: number;
    y: number;
    type: "maximum" | "minimum" | "inflection" | "root" | "custom";
    label?: string;
    color?: string;
}

export interface AsymptoteConfig {
    type: "vertical" | "horizontal" | "oblique";
    /** For vertical: x value; for horizontal: y value */
    value?: number;
    /** For oblique: slope and intercept (y = mx + b) */
    slope?: number;
    intercept?: number;
    label?: string;
    color?: string;
}

export interface ShadedRegionConfig {
    /** X range for shading */
    xRange: [number, number];
    /** Upper bound function */
    upperFn: string | ((x: number) => number);
    /** Lower bound function (default: y = 0) */
    lowerFn?: string | ((x: number) => number);
    /** Fill color */
    color?: string;
    /** Fill opacity */
    opacity?: number;
    /** Label for the region */
    label?: string;
}

export interface EnhancedFunctionPlotProps {
    /** Functions to plot */
    functions: FunctionConfig[];
    /** X-axis range */
    xRange?: [number, number];
    /** Y-axis range (auto-calculated if not provided) */
    yRange?: [number, number];
    /** Critical points to mark */
    criticalPoints?: CriticalPointConfig[];
    /** Asymptotes to draw */
    asymptotes?: AsymptoteConfig[];
    /** Shaded regions (for integrals) */
    shadedRegions?: ShadedRegionConfig[];
    /** Show coordinate grid */
    showGrid?: boolean;
    /** Show legend */
    showLegend?: boolean;
    /** Height in pixels */
    height?: number;
    /** Additional CSS class */
    className?: string;
    /** Show controls */
    showControls?: boolean;
    /** Title */
    title?: string;
    /** Samples for smooth curves */
    samples?: number;
}

// ============== Expression Parser ==============

const MATH_CONTEXT = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    exp: Math.exp,
    log: Math.log,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    pow: Math.pow,
    PI: Math.PI,
    E: Math.E,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    floor: Math.floor,
    ceil: Math.ceil,
    sign: Math.sign,
};

function parseExpression(expr: string | ((x: number) => number)): (x: number) => number {
    if (typeof expr === "function") return expr;

    const processed = expr
        .replace(/\^/g, "**")
        .replace(/(\d)x/g, "$1*x")
        .replace(/x(\d)/g, "x*$1");

    return (x: number) => {
        try {
            const fn = new Function(
                "x",
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            const result = fn(x, ...Object.values(MATH_CONTEXT));
            return isFinite(result) ? result : NaN;
        } catch {
            return NaN;
        }
    };
}

// ============== Helper Components ==============

function CriticalPointMarker({ point }: { point: CriticalPointConfig }) {
    const colors: Record<string, string> = {
        maximum: "#22c55e",
        minimum: "#ef4444",
        inflection: "#f59e0b",
        root: "#3b82f6",
        custom: "#8b5cf6",
    };

    const color = point.color || colors[point.type] || Theme.foreground;

    return (
        <>
            <Point x={point.x} y={point.y} color={color} />
            {point.label && (
                <Text x={point.x} y={point.y + 0.3} size={11} color={color}>
                    {point.label}
                </Text>
            )}
        </>
    );
}

function AsymptoteLine({ config, xRange, yRange }: {
    config: AsymptoteConfig;
    xRange: [number, number];
    yRange: [number, number];
}) {
    const color = config.color || "#9ca3af";

    switch (config.type) {
        case "vertical":
            return (
                <>
                    <Line.Segment
                        point1={[config.value!, yRange[0]]}
                        point2={[config.value!, yRange[1]]}
                        color={color}
                        style="dashed"
                    />
                    {config.label && (
                        <Text x={config.value! + 0.2} y={yRange[1] - 0.5} size={10} color={color}>
                            {config.label}
                        </Text>
                    )}
                </>
            );
        case "horizontal":
            return (
                <>
                    <Line.Segment
                        point1={[xRange[0], config.value!]}
                        point2={[xRange[1], config.value!]}
                        color={color}
                        style="dashed"
                    />
                    {config.label && (
                        <Text x={xRange[1] - 1} y={config.value! + 0.3} size={10} color={color}>
                            {config.label}
                        </Text>
                    )}
                </>
            );
        case "oblique":
            const m = config.slope || 1;
            const b = config.intercept || 0;
            const y1 = m * xRange[0] + b;
            const y2 = m * xRange[1] + b;
            return (
                <>
                    <Line.Segment
                        point1={[xRange[0], y1]}
                        point2={[xRange[1], y2]}
                        color={color}
                        style="dashed"
                    />
                    {config.label && (
                        <Text x={xRange[1] - 1} y={y2 + 0.3} size={10} color={color}>
                            {config.label}
                        </Text>
                    )}
                </>
            );
        default:
            return null;
    }
}

function ShadedRegion({
    config,
    samples = 50
}: {
    config: ShadedRegionConfig;
    samples?: number;
}) {
    const upperFn = useMemo(() => parseExpression(config.upperFn), [config.upperFn]);
    const lowerFn = useMemo(
        () => config.lowerFn ? parseExpression(config.lowerFn) : () => 0,
        [config.lowerFn]
    );

    const polygonPoints = useMemo(() => {
        const points: vec.Vector2[] = [];
        const [a, b] = config.xRange;
        const step = (b - a) / samples;

        // Upper curve from left to right
        for (let i = 0; i <= samples; i++) {
            const x = a + i * step;
            const y = upperFn(x);
            if (isFinite(y)) points.push([x, y]);
        }

        // Lower curve from right to left
        for (let i = samples; i >= 0; i--) {
            const x = a + i * step;
            const y = lowerFn(x);
            if (isFinite(y)) points.push([x, y]);
        }

        return points;
    }, [config.xRange, upperFn, lowerFn, samples]);

    return (
        <Polygon
            points={polygonPoints}
            color={config.color || Theme.blue}
            fillOpacity={config.opacity ?? 0.2}
        />
    );
}

// ============== Main Component ==============

export function EnhancedFunctionPlot({
    functions,
    xRange: initialXRange = [-5, 5],
    yRange: initialYRange,
    criticalPoints = [],
    asymptotes = [],
    shadedRegions = [],
    showGrid = true,
    showLegend = true,
    height = 300,
    className,
    showControls = true,
    title,
    samples = 100,
}: EnhancedFunctionPlotProps) {
    // Parse all functions
    const parsedFunctions = useMemo(
        () => functions.map(f => ({
            ...f,
            fn: parseExpression(f.expr),
        })),
        [functions]
    );

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewBounds, setViewBounds] = useState({
        x: initialXRange,
        y: initialYRange,
    });

    // Calculate auto Y range if not provided
    const calculatedYRange = useMemo(() => {
        if (viewBounds.y) return viewBounds.y as [number, number];

        let yMin = Infinity, yMax = -Infinity;
        const [xMin, xMax] = viewBounds.x;
        const step = (xMax - xMin) / 100;

        parsedFunctions.forEach(({ fn }) => {
            for (let x = xMin; x <= xMax; x += step) {
                const y = fn(x);
                if (isFinite(y)) {
                    yMin = Math.min(yMin, y);
                    yMax = Math.max(yMax, y);
                }
            }
        });

        // Add padding
        const padding = (yMax - yMin) * 0.1 || 1;
        return [yMin - padding, yMax + padding] as [number, number];
    }, [parsedFunctions, viewBounds]);

    // Zoom handlers for control buttons
    const handleZoomIn = useCallback(() => {
        const factor = 0.8;
        setViewBounds(prev => {
            const centerX = (prev.x[0] + prev.x[1]) / 2;
            const halfWidth = (prev.x[1] - prev.x[0]) / 2 * factor;
            return {
                x: [centerX - halfWidth, centerX + halfWidth] as [number, number],
                y: prev.y,
            };
        });
        setZoomLevel(prev => prev / factor);
    }, []);

    const handleZoomOut = useCallback(() => {
        const factor = 1.25;
        setViewBounds(prev => {
            const centerX = (prev.x[0] + prev.x[1]) / 2;
            const halfWidth = (prev.x[1] - prev.x[0]) / 2 * factor;
            return {
                x: [centerX - halfWidth, centerX + halfWidth] as [number, number],
                y: prev.y,
            };
        });
        setZoomLevel(prev => prev / factor);
    }, []);

    const handleReset = useCallback(() => {
        setViewBounds({ x: initialXRange, y: initialYRange });
        setZoomLevel(1);
    }, [initialXRange, initialYRange]);

    // Default colors for functions
    const defaultColors = [Theme.blue, Theme.red, Theme.green, Theme.orange, Theme.pink];

    return (
        <div
            className={cn(
                "relative w-full rounded-lg overflow-hidden border",
                "bg-slate-50 dark:bg-slate-900/50",
                "[&_.MafsView]:!bg-transparent",
                className
            )}
            style={{ height }}
        >
            {/* Title */}
            {title && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded border">
                    {title}
                </div>
            )}

            {/* Controls */}
            {showControls && (
                <Viz2DControls
                    onReset={handleReset}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    zoomLevel={zoomLevel}
                />
            )}

            {/* Legend */}
            {showLegend && functions.some(f => f.label) && (
                <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-2 text-xs">
                    {parsedFunctions.map((f, i) => f.label && (
                        <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded border"
                        >
                            <div
                                className="w-3 h-0.5 rounded"
                                style={{ backgroundColor: f.color || defaultColors[i % defaultColors.length] }}
                            />
                            <span>{f.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Zoom Indicator */}
            <ZoomIndicator level={zoomLevel} />

            {/* Main Plot */}
            <Mafs
                height={height}
                viewBox={{
                    x: viewBounds.x as [number, number],
                    y: calculatedYRange,
                }}
                preserveAspectRatio={false}
                pan={true}
            >
                {showGrid && <Coordinates.Cartesian />}

                {/* Shaded regions (render first, behind curves) */}
                {shadedRegions.map((region, i) => (
                    <ShadedRegion key={i} config={region} samples={samples} />
                ))}

                {/* Asymptotes */}
                {asymptotes.map((asymptote, i) => (
                    <AsymptoteLine
                        key={i}
                        config={asymptote}
                        xRange={viewBounds.x as [number, number]}
                        yRange={calculatedYRange}
                    />
                ))}

                {/* Function curves */}
                {parsedFunctions.map((fn, i) => (
                    <Plot.OfX
                        key={i}
                        y={fn.fn}
                        color={fn.color || defaultColors[i % defaultColors.length]}
                        opacity={fn.opacity ?? 1}
                        style={fn.style === "dashed" ? "dashed" : undefined}
                    />
                ))}

                {/* Critical points */}
                {criticalPoints.map((point, i) => (
                    <CriticalPointMarker key={i} point={point} />
                ))}
            </Mafs>
        </div>
    );
}

// Re-export the simple version for backwards compatibility
export { FunctionPlot } from "./FunctionPlot";
