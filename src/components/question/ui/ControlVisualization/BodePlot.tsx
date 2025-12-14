"use client";

import { useMemo } from "react";
import { Mafs, Coordinates, Plot, Line, Point, Text, Polygon, vec } from "mafs";
import { cn } from "@/lib/utils";
import type { BodePlotConfig } from "./types";
import "mafs/core.css";

export interface BodePlotProps extends Omit<BodePlotConfig, "type"> {
    height?: number;
    className?: string;
}

/**
 * Bode Plot Visualization Component
 * Renders magnitude and phase plots for transfer functions
 */
export function BodePlot({
    transferFunction,
    omegaRange,
    showAsymptotes = true,
    showPhaseMargin = false,
    showGainMargin = false,
    annotations = [],
    height = 400,
    className,
}: BodePlotProps) {
    // Generate logarithmic frequency points
    const omegaPoints = useMemo(() => {
        const logMin = Math.log10(omegaRange[0]);
        const logMax = Math.log10(omegaRange[1]);
        const numPoints = 200;
        const points: number[] = [];
        for (let i = 0; i <= numPoints; i++) {
            const logOmega = logMin + (logMax - logMin) * (i / numPoints);
            points.push(Math.pow(10, logOmega));
        }
        return points;
    }, [omegaRange]);

    // Calculate magnitude and phase from zeros, poles, gain
    const { magnitudeFunction, phaseFunction, cornerFrequencies } = useMemo(() => {
        const zeros = transferFunction.zeros ?? [];
        const poles = transferFunction.poles ?? [];
        const gain = transferFunction.gain ?? 1;
        const systemType = transferFunction.systemType ?? 0;

        // Corner frequencies for asymptotes
        const corners: number[] = [];
        zeros.forEach(z => corners.push(Math.abs(z.value)));
        poles.forEach(p => corners.push(Math.abs(p.value)));

        // Magnitude in dB
        const magFn = (omega: number): number => {
            let mag = gain;

            // System type (integrators at origin)
            mag /= Math.pow(omega, systemType);

            // Zeros
            zeros.forEach(z => {
                const mult = z.multiplicity ?? 1;
                if (z.isComplex && z.dampingRatio !== undefined) {
                    // Complex zero pair
                    const wn = z.value;
                    const zeta = z.dampingRatio;
                    const term = Math.sqrt(Math.pow(1 - (omega / wn) ** 2, 2) + Math.pow(2 * zeta * omega / wn, 2));
                    mag *= Math.pow(term, mult);
                } else {
                    // Real zero
                    const tau = 1 / z.value;
                    mag *= Math.pow(Math.sqrt(1 + (omega * tau) ** 2), mult);
                }
            });

            // Poles
            poles.forEach(p => {
                const mult = p.multiplicity ?? 1;
                if (p.isComplex && p.dampingRatio !== undefined) {
                    // Complex pole pair
                    const wn = p.value;
                    const zeta = p.dampingRatio;
                    const term = Math.sqrt(Math.pow(1 - (omega / wn) ** 2, 2) + Math.pow(2 * zeta * omega / wn, 2));
                    mag /= Math.pow(term, mult);
                } else {
                    // Real pole
                    const tau = 1 / p.value;
                    mag /= Math.pow(Math.sqrt(1 + (omega * tau) ** 2), mult);
                }
            });

            return 20 * Math.log10(Math.abs(mag));
        };

        // Phase in degrees
        const phaseFn = (omega: number): number => {
            let phase = 0;

            // System type
            phase -= systemType * 90;

            // Gain sign
            if (gain < 0) phase += 180;

            // Zeros
            zeros.forEach(z => {
                const mult = z.multiplicity ?? 1;
                if (z.isComplex && z.dampingRatio !== undefined) {
                    const wn = z.value;
                    const zeta = z.dampingRatio;
                    const ratio = omega / wn;
                    phase += mult * Math.atan2(2 * zeta * ratio, 1 - ratio ** 2) * (180 / Math.PI);
                } else {
                    const tau = 1 / z.value;
                    phase += mult * Math.atan(omega * tau) * (180 / Math.PI);
                }
            });

            // Poles
            poles.forEach(p => {
                const mult = p.multiplicity ?? 1;
                if (p.isComplex && p.dampingRatio !== undefined) {
                    const wn = p.value;
                    const zeta = p.dampingRatio;
                    const ratio = omega / wn;
                    phase -= mult * Math.atan2(2 * zeta * ratio, 1 - ratio ** 2) * (180 / Math.PI);
                } else {
                    const tau = 1 / p.value;
                    phase -= mult * Math.atan(omega * tau) * (180 / Math.PI);
                }
            });

            return phase;
        };

        return {
            magnitudeFunction: magFn,
            phaseFunction: phaseFn,
            cornerFrequencies: corners.filter(c => c > 0).sort((a, b) => a - b)
        };
    }, [transferFunction]);

    // Find crossover frequency (where magnitude = 0 dB)
    const crossoverFrequency = useMemo(() => {
        for (let i = 1; i < omegaPoints.length; i++) {
            const m1 = magnitudeFunction(omegaPoints[i - 1]);
            const m2 = magnitudeFunction(omegaPoints[i]);
            if ((m1 >= 0 && m2 < 0) || (m1 < 0 && m2 >= 0)) {
                // Linear interpolation
                return omegaPoints[i - 1] + (0 - m1) * (omegaPoints[i] - omegaPoints[i - 1]) / (m2 - m1);
            }
        }
        return null;
    }, [omegaPoints, magnitudeFunction]);

    // Calculate phase margin
    const phaseMargin = crossoverFrequency !== null
        ? 180 + phaseFunction(crossoverFrequency)
        : null;

    // Determine magnitude range
    const magRange = useMemo(() => {
        const mags = omegaPoints.map(magnitudeFunction);
        const min = Math.min(...mags);
        const max = Math.max(...mags);
        return [Math.floor(min / 20) * 20 - 20, Math.ceil(max / 20) * 20 + 20] as [number, number];
    }, [omegaPoints, magnitudeFunction]);

    const logOmegaRange: [number, number] = [
        Math.log10(omegaRange[0]),
        Math.log10(omegaRange[1])
    ];

    // Determine phase range
    const phaseRange = useMemo(() => {
        const phases = omegaPoints.map(phaseFunction);
        const min = Math.min(...phases);
        const max = Math.max(...phases);
        return [Math.floor(min / 90) * 90 - 45, Math.ceil(max / 90) * 90 + 45] as [number, number];
    }, [omegaPoints, phaseFunction]);

    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            {/* Magnitude Plot */}
            <div className="border-b">
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                    幅频特性 L(ω) / dB
                </div>
                <Mafs
                    height={height / 2}
                    viewBox={{ x: logOmegaRange, y: magRange }}
                    preserveAspectRatio={false}
                >
                    <Coordinates.Cartesian
                        xAxis={{ labels: (n) => `10^${n}` }}
                    />

                    {/* 0 dB line */}
                    <Line.Segment
                        point1={[logOmegaRange[0], 0]}
                        point2={[logOmegaRange[1], 0]}
                        color="#9ca3af"
                        style="dashed"
                        weight={1}
                    />

                    {/* Magnitude curve */}
                    <Plot.OfX
                        y={(logW) => magnitudeFunction(Math.pow(10, logW))}
                        color="#3b82f6"
                        weight={2}
                    />

                    {/* Asymptotes */}
                    {showAsymptotes && cornerFrequencies.map((wc, i) => (
                        <Line.Segment
                            key={i}
                            point1={[Math.log10(wc), magRange[0]]}
                            point2={[Math.log10(wc), magRange[1]]}
                            color="#f59e0b"
                            style="dashed"
                            opacity={0.5}
                        />
                    ))}

                    {/* Crossover frequency marker */}
                    {showPhaseMargin && crossoverFrequency && (
                        <Point
                            x={Math.log10(crossoverFrequency)}
                            y={0}
                            color="#22c55e"
                        />
                    )}
                </Mafs>
            </div>

            {/* Phase Plot */}
            <div>
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                    相频特性 φ(ω) / °
                </div>
                <Mafs
                    height={height / 2}
                    viewBox={{ x: logOmegaRange, y: phaseRange }}
                    preserveAspectRatio={false}
                >
                    <Coordinates.Cartesian
                        xAxis={{ labels: (n) => `10^${n}` }}
                    />

                    {/* -180° line */}
                    <Line.Segment
                        point1={[logOmegaRange[0], -180]}
                        point2={[logOmegaRange[1], -180]}
                        color="#ef4444"
                        style="dashed"
                        weight={1}
                    />

                    {/* Phase curve */}
                    <Plot.OfX
                        y={(logW) => phaseFunction(Math.pow(10, logW))}
                        color="#8b5cf6"
                        weight={2}
                    />

                    {/* Phase margin indicator */}
                    {showPhaseMargin && crossoverFrequency && phaseMargin !== null && (
                        <>
                            <Line.Segment
                                point1={[Math.log10(crossoverFrequency), -180]}
                                point2={[Math.log10(crossoverFrequency), phaseFunction(crossoverFrequency)]}
                                color="#22c55e"
                                weight={2}
                            />
                            <Text
                                x={Math.log10(crossoverFrequency) + 0.2}
                                y={(phaseFunction(crossoverFrequency) - 180) / 2}
                                size={12}
                            >
                                γ = {phaseMargin.toFixed(1)}°
                            </Text>
                        </>
                    )}
                </Mafs>
            </div>

            {/* Info panel */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1">
                {cornerFrequencies.length > 0 && (
                    <span>转折频率: {cornerFrequencies.map(w => w.toFixed(2)).join(", ")} rad/s</span>
                )}
                {crossoverFrequency && (
                    <span>截止频率 ωc = {crossoverFrequency.toFixed(2)} rad/s</span>
                )}
                {phaseMargin !== null && showPhaseMargin && (
                    <span className={phaseMargin > 0 ? "text-green-600" : "text-red-600"}>
                        相角裕度 γ = {phaseMargin.toFixed(1)}°
                    </span>
                )}
            </div>
        </div>
    );
}
