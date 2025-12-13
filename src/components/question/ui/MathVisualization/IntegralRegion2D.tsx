"use client";

import { Mafs, Coordinates, Plot, Polygon, Text, Theme, vec } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Viz2DInfoHint } from "./Viz2DControls";

export interface CurveConfig {
    /** Function defining the curve (string expr or function) */
    fn: string | ((x: number) => number);
    /** Display color */
    color?: string;
    /** Label for the curve */
    label?: string;
}

export interface IntegralRegion2DProps {
    /** X-axis range for the integration region [a, b] */
    xRange: [number, number];
    /** Lower bound function y = f(x) (string expr or function) */
    lowerBound: string | ((x: number) => number);
    /** Upper bound function y = g(x) (string expr or function) */
    upperBound: string | ((x: number) => number);
    /** Curves to display (optional, for context) */
    curves?: CurveConfig[];
    /** Fill color for the shaded region */
    fillColor?: string;
    /** Fill opacity (0-1) */
    fillOpacity?: number;
    /** Number of sample points for polygon */
    samples?: number;
    /** Height of the visualization */
    height?: number;
    /** Additional CSS class */
    className?: string;
    /** View box padding factor */
    padding?: number;
}

// Safe function parser
function parseExpr(expr: string | ((x: number) => number)): (x: number) => number {
    if (typeof expr === "function") return expr;

    try {
        // Basic safe parsing for common math functions
        const mathFns = {
            sin: Math.sin, cos: Math.cos, tan: Math.tan,
            asin: Math.asin, acos: Math.acos, atan: Math.atan,
            exp: Math.exp, log: Math.log, ln: Math.log,
            sqrt: Math.sqrt, abs: Math.abs, pow: Math.pow,
            PI: Math.PI, E: Math.E,
        };

        const processed = expr
            .replace(/\^/g, "**")
            .replace(/(\d)x/g, "$1*x")
            .replace(/x(\d)/g, "x*$1");

        const fn = new Function("x", ...Object.keys(mathFns), `return ${processed};`);
        return (x) => fn(x, ...Object.values(mathFns));
    } catch (err) {
        console.warn(`Failed to parse expression: ${expr}`, err);
        return () => 0;
    }
}

export function IntegralRegion2D({
    xRange,
    lowerBound,
    upperBound,
    curves = [],
    fillColor = Theme.blue,
    fillOpacity = 0.3,
    samples = 50,
    height = 300,
    className,
    padding = 0.5,
}: IntegralRegion2DProps) {
    // Parse functions
    const lowerFn = useMemo(() => parseExpr(lowerBound), [lowerBound]);
    const upperFn = useMemo(() => parseExpr(upperBound), [upperBound]);
    const parsedCurves = useMemo(() => curves.map(c => ({
        ...c,
        fn: parseExpr(c.fn)
    })), [curves]);

    // Generate polygon points for shaded region
    const polygonPoints = useMemo(() => {
        const points: vec.Vector2[] = [];
        const [a, b] = xRange;
        const step = (b - a) / samples;

        // Upper curve from left to right
        for (let i = 0; i <= samples; i++) {
            const x = a + i * step;
            points.push([x, upperFn(x)]);
        }

        // Lower curve from right to left
        for (let i = samples; i >= 0; i--) {
            const x = a + i * step;
            points.push([x, lowerFn(x)]);
        }

        return points;
    }, [xRange, lowerFn, upperFn, samples]);

    // Calculate view bounds
    const viewBounds = useMemo(() => {
        const [a, b] = xRange;
        let yMin = Infinity, yMax = -Infinity;

        // Sample both curves to find y bounds
        const allFns = [lowerFn, upperFn, ...parsedCurves.map(c => c.fn)];
        allFns.forEach(fn => {
            for (let i = 0; i <= samples; i++) {
                const x = a + (b - a) * i / samples;
                const y = fn(x);
                if (isFinite(y)) {
                    yMin = Math.min(yMin, y);
                    yMax = Math.max(yMax, y);
                }
            }
        });

        // Default range if calculation fails
        if (!isFinite(yMin) || !isFinite(yMax)) {
            yMin = -5;
            yMax = 5;
        }

        const height = yMax - yMin || 2;
        const xPad = (b - a) * padding;
        const yPad = height * padding;

        return {
            x: [a - xPad, b + xPad] as [number, number],
            y: [yMin - yPad, yMax + yPad] as [number, number],
        };
    }, [xRange, lowerFn, upperFn, parsedCurves, samples, padding]);

    return (
        <div className={cn(
            "relative w-full rounded-lg overflow-hidden border",
            "bg-slate-50 dark:bg-slate-900/50",
            "[&_.MafsView]:!bg-transparent",
            className
        )}>
            <Viz2DInfoHint />
            <Mafs height={height} viewBox={viewBounds} pan={true}>
                <Coordinates.Cartesian />

                {/* Shaded integration region */}
                <Polygon
                    points={polygonPoints}
                    color={fillColor}
                    fillOpacity={fillOpacity}
                />

                {/* Additional context curves */}
                {parsedCurves.map((curve, idx) => (
                    <Plot.OfX
                        key={idx}
                        y={curve.fn}
                        color={curve.color ?? Theme.foreground}
                    />
                ))}

                {/* Curve labels */}
                {parsedCurves.map((curve, idx) => {
                    if (!curve.label) return null;
                    const labelX = xRange[0] + (xRange[1] - xRange[0]) * 0.8;
                    const labelY = curve.fn(labelX);
                    return (
                        <Text
                            key={`label-${idx}`}
                            x={labelX}
                            y={labelY + 0.2}
                            size={12}
                            color={curve.color}
                        >
                            {curve.label}
                        </Text>
                    );
                })}
            </Mafs>
        </div>
    );
}
