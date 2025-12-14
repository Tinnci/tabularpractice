"use client";

import { useMemo } from "react";
import { Mafs, Coordinates, Plot, Line, Point, Text, Circle } from "mafs";
import { cn } from "@/lib/utils";
import type { RootLocusConfig } from "./types";
import "mafs/core.css";

interface RootLocusProps extends Omit<RootLocusConfig, "type"> {
    height?: number;
    className?: string;
}

/**
 * Root Locus Visualization Component
 * Renders poles, zeros, and root locus branches in the complex plane
 */
export function RootLocus({
    openLoopPoles,
    openLoopZeros,
    asymptotes,
    separationPoints,
    imaginaryAxisCrossings,
    branches,
    kRange,
    realAxisRange = [-5, 2],
    imagAxisRange = [-4, 4],
    showArrows = true,
    showKValues = false,
    height = 350,
    className,
}: RootLocusProps) {
    // Determine real axis segments that are part of root locus
    const realAxisSegments = useMemo(() => {
        // Collect all real-axis poles and zeros
        const realPoints: { x: number; type: "pole" | "zero" }[] = [];

        openLoopPoles.forEach(p => {
            if (p.im === 0) realPoints.push({ x: p.re, type: "pole" });
        });
        openLoopZeros.forEach(z => {
            if (z.im === 0) realPoints.push({ x: z.re, type: "zero" });
        });

        // Sort by x position
        realPoints.sort((a, b) => a.x - b.x);

        // Determine segments (odd number of poles+zeros to the right)
        const segments: Array<[number, number]> = [];
        let currentStart: number | null = null;

        for (let x = realAxisRange[1]; x >= realAxisRange[0]; x -= 0.1) {
            const countToRight = realPoints.filter(p => p.x > x).length;
            const isOnLocus = countToRight % 2 === 1;

            if (isOnLocus && currentStart === null) {
                currentStart = x;
            } else if (!isOnLocus && currentStart !== null) {
                segments.push([x, currentStart]);
                currentStart = null;
            }
        }

        if (currentStart !== null) {
            segments.push([realAxisRange[0], currentStart]);
        }

        return segments;
    }, [openLoopPoles, openLoopZeros, realAxisRange]);

    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30">
                根轨迹 / Root Locus
            </div>
            <Mafs
                height={height}
                viewBox={{ x: realAxisRange, y: imagAxisRange }}
                preserveAspectRatio={false}
            >
                <Coordinates.Cartesian />

                {/* Imaginary axis (stability boundary) */}
                <Line.Segment
                    point1={[0, imagAxisRange[0]]}
                    point2={[0, imagAxisRange[1]]}
                    color="#9ca3af"
                    weight={1}
                />

                {/* Real axis segments that are part of root locus */}
                {realAxisSegments.map(([x1, x2], i) => (
                    <Line.Segment
                        key={`seg-${i}`}
                        point1={[x1, 0]}
                        point2={[x2, 0]}
                        color="#3b82f6"
                        weight={3}
                    />
                ))}

                {/* Asymptotes */}
                {asymptotes && asymptotes.angles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const length = Math.max(
                        Math.abs(realAxisRange[1] - realAxisRange[0]),
                        Math.abs(imagAxisRange[1] - imagAxisRange[0])
                    );
                    return (
                        <Line.Segment
                            key={`asym-${i}`}
                            point1={[asymptotes.centroid, 0]}
                            point2={[
                                asymptotes.centroid + length * Math.cos(rad),
                                length * Math.sin(rad)
                            ]}
                            color="#f59e0b"
                            style="dashed"
                            opacity={0.6}
                        />
                    );
                })}

                {/* Custom branches */}
                {branches?.map((branch, i) => (
                    <Plot.Parametric
                        key={`branch-${i}`}
                        xy={(t) => {
                            const idx = Math.floor(t * (branch.points.length - 1));
                            const p = branch.points[Math.min(idx, branch.points.length - 1)];
                            return [p.re, p.im];
                        }}
                        t={[0, 1]}
                        color="#3b82f6"
                        weight={2}
                    />
                ))}

                {/* Imaginary axis crossings */}
                {imaginaryAxisCrossings?.map((crossing, i) => (
                    <Point
                        key={`cross-${i}`}
                        x={0}
                        y={crossing.im}
                        color="#ef4444"
                    />
                ))}

                {/* Separation points */}
                {separationPoints?.map((sp, i) => (
                    <Point
                        key={`sep-${i}`}
                        x={sp.re}
                        y={sp.im}
                        color="#22c55e"
                    />
                ))}

                {/* Open-loop poles (×) */}
                {openLoopPoles.map((pole, i) => (
                    <Text
                        key={`pole-${i}`}
                        x={pole.re}
                        y={pole.im}
                        size={20}
                        color="#ef4444"
                    >
                        ×
                    </Text>
                ))}

                {/* Open-loop zeros (○) */}
                {openLoopZeros.map((zero, i) => (
                    <Circle
                        key={`zero-${i}`}
                        center={[zero.re, zero.im]}
                        radius={0.15}
                        color="#3b82f6"
                        fillOpacity={0}
                        strokeOpacity={1}
                    />
                ))}

                {/* Axis labels */}
                <Text x={realAxisRange[1] - 0.3} y={-0.3} size={12}>
                    Re
                </Text>
                <Text x={0.15} y={imagAxisRange[1] - 0.3} size={12}>
                    Im
                </Text>
            </Mafs>

            {/* Legend */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                    <span className="text-red-500 font-bold">×</span> 开环极点
                </span>
                <span className="flex items-center gap-1">
                    <span className="text-blue-500">○</span> 开环零点
                </span>
                {asymptotes && (
                    <span>渐近线重心: σa = {asymptotes.centroid.toFixed(2)}</span>
                )}
                {imaginaryAxisCrossings && imaginaryAxisCrossings.length > 0 && (
                    <span>
                        虚轴交点: {imaginaryAxisCrossings.map(c => `±j${c.im.toFixed(2)}`).join(", ")}
                    </span>
                )}
            </div>
        </div>
    );
}
