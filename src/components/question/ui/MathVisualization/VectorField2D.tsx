"use client";

/**
 * 2D Vector Field Visualization
 * 
 * For visualizing:
 * - Gradient fields
 * - Line integrals (Green's theorem)
 * - Conservative vs non-conservative fields
 * - Streamlines
 */

import { Mafs, Coordinates, Line, Point, vec } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Viz2DInfoHint } from "./Viz2DControls";

// ============== Types ==============

export interface VectorField2DProps {
    /** X-component of vector field: P(x, y) */
    fx: string | ((x: number, y: number) => number);
    /** Y-component of vector field: Q(x, y) */
    fy: string | ((x: number, y: number) => number);
    /** X-axis range */
    xRange?: [number, number];
    /** Y-axis range */
    yRange?: [number, number];
    /** Number of arrows per axis */
    density?: number;
    /** Arrow scale factor */
    scale?: number;
    /** Show curl coloring (for non-conservative fields) */
    showCurl?: boolean;
    /** Show divergence coloring */
    showDivergence?: boolean;
    /** Parametric curve path (for line integrals) */
    curvePath?: {
        x: string | ((t: number) => number);
        y: string | ((t: number) => number);
        tRange: [number, number];
        color?: string;
        showDirection?: boolean;
    };
    /** Height in pixels */
    height?: number;
    /** Additional CSS class */
    className?: string;
    /** Title */
    title?: string;
    /** Show controls */
    showControls?: boolean;
    /** Arrow color (when not using curl/divergence coloring) */
    arrowColor?: string;
    /** Show legend */
    showLegend?: boolean;
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
};

function parseExpr2D(expr: string | ((x: number, y: number) => number)): (x: number, y: number) => number {
    if (typeof expr === "function") return expr;

    const processed = expr.replace(/\^/g, "**");

    return (x: number, y: number) => {
        try {
            const fn = new Function(
                "x", "y",
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            const result = fn(x, y, ...Object.values(MATH_CONTEXT));
            return isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    };
}

function parseExpr1D(expr: string | ((t: number) => number)): (t: number) => number {
    if (typeof expr === "function") return expr;

    const processed = expr.replace(/\^/g, "**");

    return (t: number) => {
        try {
            const fn = new Function(
                "t",
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            return fn(t, ...Object.values(MATH_CONTEXT));
        } catch {
            return 0;
        }
    };
}

// ============== Arrow Component ==============

interface Arrow2DProps {
    start: vec.Vector2;
    direction: vec.Vector2;
    color: string;
    scale?: number;
}

function Arrow2D({ start, direction, color, scale = 1 }: Arrow2DProps) {
    const [dx, dy] = direction;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.001) return null;

    const normalizedScale = Math.min(length * scale, 0.4);
    const endX = start[0] + (dx / length) * normalizedScale;
    const endY = start[1] + (dy / length) * normalizedScale;

    // Arrow head
    const headSize = normalizedScale * 0.3;
    const angle = Math.atan2(dy, dx);
    const head1X = endX - headSize * Math.cos(angle - Math.PI / 6);
    const head1Y = endY - headSize * Math.sin(angle - Math.PI / 6);
    const head2X = endX - headSize * Math.cos(angle + Math.PI / 6);
    const head2Y = endY - headSize * Math.sin(angle + Math.PI / 6);

    return (
        <>
            <Line.Segment point1={start} point2={[endX, endY]} color={color} />
            <Line.Segment point1={[endX, endY]} point2={[head1X, head1Y]} color={color} />
            <Line.Segment point1={[endX, endY]} point2={[head2X, head2Y]} color={color} />
        </>
    );
}

// ============== Main Component ==============

export function VectorField2D({
    fx,
    fy,
    xRange = [-3, 3],
    yRange = [-3, 3],
    density = 8,
    scale = 0.5,
    showCurl = false,
    showDivergence = false,
    curvePath,
    height = 300,
    className,
    title,
    showControls = true,
    arrowColor = "#3b82f6",
    showLegend = true,
}: VectorField2DProps) {
    // Parse vector field functions
    const fnX = useMemo(() => parseExpr2D(fx), [fx]);
    const fnY = useMemo(() => parseExpr2D(fy), [fy]);

    // Parse curve path if provided
    const curveX = useMemo(
        () => curvePath ? parseExpr1D(curvePath.x) : null,
        [curvePath]
    );
    const curveY = useMemo(
        () => curvePath ? parseExpr1D(curvePath.y) : null,
        [curvePath]
    );

    // Calculate curl at a point: ∂Q/∂x - ∂P/∂y
    const calculateCurl = useMemo(() => {
        if (!showCurl) return null;
        return (x: number, y: number) => {
            const h = 0.001;
            const dQdx = (fnY(x + h, y) - fnY(x - h, y)) / (2 * h);
            const dPdy = (fnX(x, y + h) - fnX(x, y - h)) / (2 * h);
            return dQdx - dPdy;
        };
    }, [fnX, fnY, showCurl]);

    // Calculate divergence: ∂P/∂x + ∂Q/∂y
    const calculateDiv = useMemo(() => {
        if (!showDivergence) return null;
        return (x: number, y: number) => {
            const h = 0.001;
            const dPdx = (fnX(x + h, y) - fnX(x - h, y)) / (2 * h);
            const dQdy = (fnY(x, y + h) - fnY(x, y - h)) / (2 * h);
            return dPdx + dQdy;
        };
    }, [fnX, fnY, showDivergence]);

    // Generate arrow data
    const arrows = useMemo(() => {
        const result: Array<{ start: vec.Vector2; direction: vec.Vector2; color: string }> = [];
        const stepX = (xRange[1] - xRange[0]) / density;
        const stepY = (yRange[1] - yRange[0]) / density;

        for (let i = 0; i <= density; i++) {
            for (let j = 0; j <= density; j++) {
                const x = xRange[0] + i * stepX;
                const y = yRange[0] + j * stepY;
                const vx = fnX(x, y);
                const vy = fnY(x, y);

                // Determine color based on curl or divergence
                let color = arrowColor;
                if (showCurl && calculateCurl) {
                    const curl = calculateCurl(x, y);
                    if (curl > 0.1) color = "#22c55e"; // Positive curl (counterclockwise)
                    else if (curl < -0.1) color = "#ef4444"; // Negative curl (clockwise)
                } else if (showDivergence && calculateDiv) {
                    const div = calculateDiv(x, y);
                    if (div > 0.1) color = "#22c55e"; // Source
                    else if (div < -0.1) color = "#ef4444"; // Sink
                }

                result.push({
                    start: [x, y],
                    direction: [vx, vy],
                    color,
                });
            }
        }

        return result;
    }, [xRange, yRange, density, fnX, fnY, arrowColor, showCurl, showDivergence, calculateCurl, calculateDiv]);

    // Generate curve points
    const curvePoints = useMemo(() => {
        if (!curvePath || !curveX || !curveY) return null;

        const points: vec.Vector2[] = [];
        const [tMin, tMax] = curvePath.tRange;
        const samples = 100;
        const step = (tMax - tMin) / samples;

        for (let i = 0; i <= samples; i++) {
            const t = tMin + i * step;
            points.push([curveX(t), curveY(t)]);
        }

        return points;
    }, [curvePath, curveX, curveY]);

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
            {showControls && <Viz2DInfoHint />}

            {/* Legend */}
            {showLegend && (showCurl || showDivergence) && (
                <div className="absolute bottom-2 left-2 z-10 text-xs space-y-1 bg-background/80 backdrop-blur-sm p-2 rounded border">
                    {showCurl && (
                        <>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>逆时针旋度</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>顺时针旋度</span>
                            </div>
                        </>
                    )}
                    {showDivergence && (
                        <>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>源 (div &gt; 0)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>汇 (div &lt; 0)</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Main Plot */}
            <Mafs
                height={height}
                viewBox={{
                    x: xRange,
                    y: yRange,
                }}
                preserveAspectRatio={false}
            >
                <Coordinates.Cartesian />

                {/* Vector field arrows */}
                {arrows.map((arrow, i) => (
                    <Arrow2D
                        key={i}
                        start={arrow.start}
                        direction={arrow.direction}
                        color={arrow.color}
                        scale={scale}
                    />
                ))}

                {/* Curve path (for line integrals) */}
                {curvePoints && curvePoints.length > 1 && (
                    <>
                        {curvePoints.slice(0, -1).map((point, i) => (
                            <Line.Segment
                                key={i}
                                point1={point}
                                point2={curvePoints[i + 1]}
                                color={curvePath?.color || "#f59e0b"}
                            />
                        ))}
                        {/* Direction arrow at midpoint */}
                        {curvePath?.showDirection && curveX && curveY && (
                            <Point
                                x={curveX((curvePath.tRange[0] + curvePath.tRange[1]) / 2)}
                                y={curveY((curvePath.tRange[0] + curvePath.tRange[1]) / 2)}
                                color={curvePath?.color || "#f59e0b"}
                            />
                        )}
                    </>
                )}
            </Mafs>
        </div>
    );
}
