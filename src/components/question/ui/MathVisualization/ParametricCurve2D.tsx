"use client";

import React from "react";

/**
 * 2D Parametric Curve Visualization
 * 
 * For visualizing:
 * - Parametric curves r(t) = (x(t), y(t))
 * - Arc length calculations
 * - Line integrals of the first kind
 * - Tangent/normal vectors
 */

import { Mafs, Coordinates, Line, Point, Text, Theme, vec } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Viz2DInfoHint } from "./Viz2DControls";

// ============== Types ==============

export interface TangentVectorConfig {
    t: number;
    color?: string;
    scale?: number;
    showLabel?: boolean;
}

export interface ParametricCurve2DProps {
    /** X-component as function of t */
    x: string | ((t: number) => number);
    /** Y-component as function of t */
    y: string | ((t: number) => number);
    /** Parameter range [t_min, t_max] */
    tRange: [number, number];
    /** Curve color */
    color?: string;
    /** Line weight */
    weight?: number;
    /** Show direction arrows along curve */
    showDirection?: boolean;
    /** Number of direction arrows */
    directionArrowCount?: number;
    /** Tangent vectors to show */
    tangentVectors?: TangentVectorConfig[];
    /** Normal vectors to show */
    normalVectors?: TangentVectorConfig[];
    /** Points to highlight on the curve */
    highlightPoints?: Array<{
        t: number;
        label?: string;
        color?: string;
    }>;
    /** X-axis viewing range */
    xRange?: [number, number];
    /** Y-axis viewing range */
    yRange?: [number, number];
    /** Height in pixels */
    height?: number;
    /** Additional CSS class */
    className?: string;
    /** Title */
    title?: string;
    /** Show controls */
    showControls?: boolean;
    /** Curve label */
    label?: string;
    /** Number of samples for smooth curve */
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
};

function parseExpr(expr: string | ((t: number) => number)): (t: number) => number {
    if (typeof expr === "function") return expr;

    const processed = expr.replace(/\^/g, "**");

    return (t: number) => {
        try {
            const fn = new Function(
                "t",
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            const result = fn(t, ...Object.values(MATH_CONTEXT));
            return isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    };
}

// ============== Arrow Component ==============

function DirectionArrow({
    position,
    direction,
    color
}: {
    position: vec.Vector2;
    direction: vec.Vector2;
    color: string;
}) {
    const [dx, dy] = direction;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.001) return null;

    const scale = 0.2;
    const normalized: vec.Vector2 = [dx / length * scale, dy / length * scale];
    const end: vec.Vector2 = [position[0] + normalized[0], position[1] + normalized[1]];

    // Arrow head
    const angle = Math.atan2(dy, dx);
    const headSize = scale * 0.4;
    const head1: vec.Vector2 = [
        end[0] - headSize * Math.cos(angle - Math.PI / 6),
        end[1] - headSize * Math.sin(angle - Math.PI / 6),
    ];
    const head2: vec.Vector2 = [
        end[0] - headSize * Math.cos(angle + Math.PI / 6),
        end[1] - headSize * Math.sin(angle + Math.PI / 6),
    ];

    return (
        <>
            <Line.Segment point1={position} point2={end} color={color} />
            <Line.Segment point1={end} point2={head1} color={color} />
            <Line.Segment point1={end} point2={head2} color={color} />
        </>
    );
}

// ============== Tangent/Normal Vector Component ==============

function TangentNormalVector({
    position,
    direction,
    color,
    scale = 0.5,
    label,
}: {
    position: vec.Vector2;
    direction: vec.Vector2;
    color: string;
    scale?: number;
    label?: string;
}) {
    const [dx, dy] = direction;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.001) return null;

    const normalized: vec.Vector2 = [dx / length * scale, dy / length * scale];
    const end: vec.Vector2 = [position[0] + normalized[0], position[1] + normalized[1]];

    return (
        <>
            <Line.Segment point1={position} point2={end} color={color} />
            <Point x={end[0]} y={end[1]} color={color} />
            {label && (
                <Text x={end[0] + 0.1} y={end[1] + 0.1} size={10} color={color}>
                    {label}
                </Text>
            )}
        </>
    );
}

// ============== Main Component ==============

export function ParametricCurve2D({
    x,
    y,
    tRange,
    color = Theme.blue,
    // Note: 'weight' prop is defined in interface for future use when Mafs supports lineWidth
    showDirection = false,
    directionArrowCount = 5,
    tangentVectors = [],
    normalVectors = [],
    highlightPoints = [],
    xRange,
    yRange,
    height = 300,
    className,
    title,
    showControls = true,
    label,
    samples = 200,
}: ParametricCurve2DProps) {
    // Parse parametric functions
    const fnX = useMemo(() => parseExpr(x), [x]);
    const fnY = useMemo(() => parseExpr(y), [y]);

    // Generate curve points
    const curvePoints = useMemo(() => {
        const points: vec.Vector2[] = [];
        const [tMin, tMax] = tRange;
        const step = (tMax - tMin) / samples;

        for (let i = 0; i <= samples; i++) {
            const t = tMin + i * step;
            const px = fnX(t);
            const py = fnY(t);
            if (isFinite(px) && isFinite(py)) {
                points.push([px, py]);
            }
        }

        return points;
    }, [fnX, fnY, tRange, samples]);

    // Calculate view bounds if not provided
    const viewBounds = useMemo(() => {
        if (xRange && yRange) {
            return { x: xRange, y: yRange };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        curvePoints.forEach(([px, py]) => {
            minX = Math.min(minX, px);
            maxX = Math.max(maxX, px);
            minY = Math.min(minY, py);
            maxY = Math.max(maxY, py);
        });

        const padX = (maxX - minX) * 0.2 || 1;
        const padY = (maxY - minY) * 0.2 || 1;

        return {
            x: [minX - padX, maxX + padX] as [number, number],
            y: [minY - padY, maxY + padY] as [number, number],
        };
    }, [curvePoints, xRange, yRange]);

    // Calculate tangent vector at parameter t
    const getTangent = useMemo(() => {
        return (t: number): vec.Vector2 => {
            const h = 0.001;
            const dx = (fnX(t + h) - fnX(t - h)) / (2 * h);
            const dy = (fnY(t + h) - fnY(t - h)) / (2 * h);
            return [dx, dy];
        };
    }, [fnX, fnY]);

    // Calculate normal vector at parameter t (perpendicular to tangent)
    const getNormal = useMemo(() => {
        return (t: number): vec.Vector2 => {
            const [dx, dy] = getTangent(t);
            return [-dy, dx]; // Rotate 90 degrees counterclockwise
        };
    }, [getTangent]);

    // Direction arrows along curve
    const directionArrows = useMemo(() => {
        if (!showDirection) return [];

        const arrows: Array<{ position: vec.Vector2; direction: vec.Vector2 }> = [];
        const [tMin, tMax] = tRange;

        for (let i = 1; i <= directionArrowCount; i++) {
            const t = tMin + (tMax - tMin) * i / (directionArrowCount + 1);
            const position: vec.Vector2 = [fnX(t), fnY(t)];
            const direction = getTangent(t);
            arrows.push({ position, direction });
        }

        return arrows;
    }, [showDirection, directionArrowCount, tRange, fnX, fnY, getTangent]);

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

            {/* Label */}
            {label && curvePoints.length > 0 && (
                <div className="absolute bottom-2 left-2 z-10 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm rounded border flex items-center gap-1">
                    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
                    <span>{label}</span>
                </div>
            )}

            {/* Main Plot */}
            <Mafs
                height={height}
                viewBox={viewBounds}
                preserveAspectRatio={false}
                pan={true}
            >
                <Coordinates.Cartesian />

                {/* Main curve */}
                {curvePoints.length > 1 && curvePoints.slice(0, -1).map((point, i) => (
                    <Line.Segment
                        key={i}
                        point1={point}
                        point2={curvePoints[i + 1]}
                        color={color}
                    />
                ))}

                {/* Direction arrows */}
                {directionArrows.map((arrow, i) => (
                    <DirectionArrow
                        key={`dir-${i}`}
                        position={arrow.position}
                        direction={arrow.direction}
                        color={color}
                    />
                ))}

                {/* Tangent vectors */}
                {tangentVectors.map((config, i) => {
                    const position: vec.Vector2 = [fnX(config.t), fnY(config.t)];
                    const tangent = getTangent(config.t);
                    return (
                        <TangentNormalVector
                            key={`tan-${i}`}
                            position={position}
                            direction={tangent}
                            color={config.color || "#22c55e"}
                            scale={config.scale}
                            label={config.showLabel ? "T" : undefined}
                        />
                    );
                })}

                {/* Normal vectors */}
                {normalVectors.map((config, i) => {
                    const position: vec.Vector2 = [fnX(config.t), fnY(config.t)];
                    const normal = getNormal(config.t);
                    return (
                        <TangentNormalVector
                            key={`norm-${i}`}
                            position={position}
                            direction={normal}
                            color={config.color || "#f59e0b"}
                            scale={config.scale}
                            label={config.showLabel ? "N" : undefined}
                        />
                    );
                })}

                {/* Highlight points */}
                {highlightPoints.map((point, i) => {
                    const px = fnX(point.t);
                    const py = fnY(point.t);
                    return (
                        <React.Fragment key={`point-${i}`}>
                            <Point x={px} y={py} color={point.color || Theme.foreground} />
                            {point.label && (
                                <Text x={px + 0.15} y={py + 0.15} size={11} color={point.color || Theme.foreground}>
                                    {point.label}
                                </Text>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Start and end points */}
                <Point x={fnX(tRange[0])} y={fnY(tRange[0])} color={Theme.green} />
                <Point x={fnX(tRange[1])} y={fnY(tRange[1])} color={Theme.red} />
            </Mafs>
        </div>
    );
}
