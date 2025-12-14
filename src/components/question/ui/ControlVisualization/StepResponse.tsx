"use client";

import { useMemo } from "react";
import { Mafs, Coordinates, Plot, Line, Point, Text, useMovablePoint, vec } from "mafs";
import { cn } from "@/lib/utils";
import type { StepResponseConfig } from "./types";
import "mafs/core.css";

export interface StepResponseProps extends Omit<StepResponseConfig, "type"> {
    height?: number;
    className?: string;
}

/**
 * Step Response Visualization Component
 * Renders first-order and second-order system step responses with annotations
 */
export function StepResponse({
    systemType,
    timeConstant = 1,
    gain = 1,
    dampingRatio = 0.5,
    naturalFrequency = 1,
    customExpression,
    tRange,
    yRange,
    annotations = [],
    showGrid = true,
    height = 300,
    className,
}: StepResponseProps) {
    // Calculate response function based on system type
    const responseFunction = useMemo(() => {
        if (customExpression) {
            // Custom expression - would need a parser
            return (t: number) => {
                // Simple evaluation for common patterns
                try {
                    // Replace common patterns
                    const expr = customExpression
                        .replace(/exp\(/g, "Math.exp(")
                        .replace(/sin\(/g, "Math.sin(")
                        .replace(/cos\(/g, "Math.cos(")
                        .replace(/sqrt\(/g, "Math.sqrt(")
                        .replace(/t/g, String(t));
                    return eval(expr);
                } catch {
                    return 0;
                }
            };
        }

        if (systemType === "first-order") {
            // First-order: c(t) = K * (1 - e^(-t/T))
            return (t: number) => {
                if (t < 0) return 0;
                return gain * (1 - Math.exp(-t / timeConstant));
            };
        }

        if (systemType === "second-order") {
            // Second-order response depends on damping ratio
            const wn = naturalFrequency;
            const zeta = dampingRatio;

            if (zeta < 1) {
                // Underdamped
                const wd = wn * Math.sqrt(1 - zeta * zeta);
                return (t: number) => {
                    if (t < 0) return 0;
                    const envelope = Math.exp(-zeta * wn * t);
                    const phase = Math.atan2(zeta, Math.sqrt(1 - zeta * zeta));
                    return gain * (1 - (envelope / Math.sqrt(1 - zeta * zeta)) * Math.cos(wd * t - phase));
                };
            } else if (zeta === 1) {
                // Critically damped
                return (t: number) => {
                    if (t < 0) return 0;
                    return gain * (1 - (1 + wn * t) * Math.exp(-wn * t));
                };
            } else {
                // Overdamped
                const s1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
                const s2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
                return (t: number) => {
                    if (t < 0) return 0;
                    const c1 = s2 / (s2 - s1);
                    const c2 = s1 / (s1 - s2);
                    return gain * (1 + c1 * Math.exp(s1 * t) + c2 * Math.exp(s2 * t));
                };
            }
        }

        return (t: number) => t >= 0 ? gain : 0;
    }, [systemType, timeConstant, gain, dampingRatio, naturalFrequency, customExpression]);

    // Calculate steady-state value
    const steadyStateValue = gain;

    // Calculate settling time (2% criterion for second-order)
    const settlingTime = useMemo(() => {
        if (systemType === "first-order") {
            return 4 * timeConstant; // 98% of final value
        }
        if (systemType === "second-order" && dampingRatio > 0) {
            return 4 / (dampingRatio * naturalFrequency);
        }
        return tRange[1];
    }, [systemType, timeConstant, dampingRatio, naturalFrequency, tRange]);

    // Calculate overshoot for underdamped second-order
    const overshoot = useMemo(() => {
        if (systemType === "second-order" && dampingRatio < 1) {
            return gain * Math.exp(-Math.PI * dampingRatio / Math.sqrt(1 - dampingRatio * dampingRatio));
        }
        return 0;
    }, [systemType, dampingRatio, gain]);

    // Calculate rise time (10% to 90%)
    const riseTime = useMemo(() => {
        if (systemType === "first-order") {
            return 2.2 * timeConstant;
        }
        if (systemType === "second-order" && dampingRatio < 1) {
            const wd = naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
            return (Math.PI - Math.atan2(Math.sqrt(1 - dampingRatio * dampingRatio), dampingRatio)) / wd;
        }
        return timeConstant;
    }, [systemType, timeConstant, dampingRatio, naturalFrequency]);

    // Auto-calculate y range if not provided
    const computedYRange = yRange ?? [
        -0.1 * gain,
        (overshoot > 0 ? steadyStateValue + overshoot * 1.2 : steadyStateValue * 1.3)
    ];

    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            <Mafs
                height={height}
                viewBox={{ x: tRange, y: computedYRange }}
                preserveAspectRatio={false}
            >
                {showGrid && <Coordinates.Cartesian />}

                {/* Step response curve */}
                <Plot.OfX
                    y={responseFunction}
                    color="#3b82f6"
                    weight={2}
                />

                {/* Unit step input (dashed) */}
                <Plot.OfX
                    y={(t) => t >= 0 ? 1 : 0}
                    color="#9ca3af"
                    style="dashed"
                    weight={1}
                />

                {/* Steady-state line */}
                <Line.Segment
                    point1={[0, steadyStateValue]}
                    point2={[tRange[1], steadyStateValue]}
                    color="#22c55e"
                    style="dashed"
                    weight={1}
                />

                {/* Annotations */}
                {annotations.map((ann, i) => {
                    if (ann.type === "steady-state") {
                        return (
                            <Text
                                key={i}
                                x={tRange[1] * 0.8}
                                y={steadyStateValue + 0.1 * gain}
                                size={12}
                            >
                                {ann.label ?? `稳态值: ${steadyStateValue.toFixed(2)}`}
                            </Text>
                        );
                    }
                    if (ann.type === "settling-time" && settlingTime < tRange[1]) {
                        return (
                            <Line.Segment
                                key={i}
                                point1={[settlingTime, 0]}
                                point2={[settlingTime, steadyStateValue]}
                                color="#f59e0b"
                                style="dashed"
                            />
                        );
                    }
                    if (ann.type === "time-constant" && systemType === "first-order") {
                        return (
                            <Point
                                key={i}
                                x={timeConstant}
                                y={gain * (1 - Math.exp(-1))}
                                color="#ef4444"
                            />
                        );
                    }
                    if (ann.type === "overshoot" && overshoot > 0) {
                        const peakTime = Math.PI / (naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio));
                        return (
                            <Point
                                key={i}
                                x={peakTime}
                                y={steadyStateValue + overshoot}
                                color="#ef4444"
                            />
                        );
                    }
                    return null;
                })}

                {/* Axis labels */}
                <Text x={tRange[1] * 0.9} y={-0.05 * gain} size={14}>
                    t
                </Text>
                <Text x={-tRange[1] * 0.05} y={computedYRange[1] * 0.9} size={14}>
                    c(t)
                </Text>
            </Mafs>

            {/* Info panel */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1">
                {systemType === "first-order" && (
                    <>
                        <span>时间常数 T = {timeConstant}</span>
                        <span>增益 K = {gain}</span>
                        <span>调节时间 ts ≈ {settlingTime.toFixed(2)}</span>
                    </>
                )}
                {systemType === "second-order" && (
                    <>
                        <span>阻尼比 ζ = {dampingRatio}</span>
                        <span>自然频率 ωn = {naturalFrequency}</span>
                        {dampingRatio < 1 && <span>超调量 σ% ≈ {(overshoot / gain * 100).toFixed(1)}%</span>}
                        <span>调节时间 ts ≈ {settlingTime.toFixed(2)}</span>
                    </>
                )}
            </div>
        </div>
    );
}
