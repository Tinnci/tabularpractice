"use client";

import { Mafs, Coordinates, Plot, Polygon, Text, Theme, vec, Line } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * Configuration for a mathematical visualization.
 * This can be embedded in eureka.visualization in the question data.
 */
export interface VisualizationConfig {
    /** Type of visualization */
    type: "integral-region-2d" | "function-plot" | "parametric" | "vector-field";
    /** Title shown above the visualization */
    title?: string;
    /** Configuration specific to the visualization type */
    config: IntegralRegion2DConfig | FunctionPlotConfig;
}

export interface FunctionPlotConfig {
    type: "function-plot";
    /** Functions to plot */
    functions: Array<{
        /** Function expression as string, will be eval'd */
        expr: string;
        color?: string;
        label?: string;
    }>;
    /** X-axis range */
    xRange?: [number, number];
    /** Y-axis range */
    yRange?: [number, number];
}

export interface IntegralRegion2DConfig {
    type: "integral-region-2d";
    /** X-axis integration bounds */
    xRange: [number, number];
    /** Lower bound expression (e.g., "x*x") */
    lowerBound: string;
    /** Upper bound expression (e.g., "x") */
    upperBound: string;
    /** Additional curves to show */
    curves?: Array<{
        expr: string;
        color?: string;
        label?: string;
    }>;
    /** Labels for key points */
    labels?: Array<{
        x: number;
        y: number;
        text: string;
    }>;
}

// Safe function parser - converts string expression to function
function parseExpression(expr: string): (x: number) => number {
    // Create a safe evaluation context
    const mathFns = {
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

    return (x: number) => {
        try {
            // Replace common patterns
            let processed = expr
                .replace(/\^/g, "**")  // x^2 -> x**2
                .replace(/(\d)x/g, "$1*x")  // 2x -> 2*x
                .replace(/x(\d)/g, "x*$1");  // x2 -> x*2

            // Create function with math context
            const fn = new Function(
                "x",
                ...Object.keys(mathFns),
                `return ${processed}`
            );
            return fn(x, ...Object.values(mathFns));
        } catch {
            return 0;
        }
    };
}

export interface MathVisualizationRendererProps {
    config: VisualizationConfig;
    height?: number;
    className?: string;
}

/**
 * Universal renderer for mathematical visualizations.
 * Parses configuration from eureka data and renders appropriate visualization.
 */
export function MathVisualizationRenderer({
    config,
    height = 280,
    className,
}: MathVisualizationRendererProps) {
    const visualization = useMemo(() => {
        if (config.type === "integral-region-2d") {
            const cfg = config.config as IntegralRegion2DConfig;
            return (
                <IntegralRegionRenderer
                    config={cfg}
                    height={height}
                />
            );
        }

        if (config.type === "function-plot") {
            const cfg = config.config as FunctionPlotConfig;
            return (
                <FunctionPlotRenderer
                    config={cfg}
                    height={height}
                />
            );
        }

        return null;
    }, [config, height]);

    if (!visualization) return null;

    return (
        <div className={cn("space-y-2", className)}>
            {config.title && (
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    📊 {config.title}
                </div>
            )}
            <div className="rounded-lg overflow-hidden border bg-background">
                {visualization}
            </div>
        </div>
    );
}

// Internal component for integral region visualization
function IntegralRegionRenderer({
    config,
    height,
}: {
    config: IntegralRegion2DConfig;
    height: number;
}) {
    const lowerFn = useMemo(() => parseExpression(config.lowerBound), [config.lowerBound]);
    const upperFn = useMemo(() => parseExpression(config.upperBound), [config.upperBound]);
    const curveFns = useMemo(
        () => (config.curves || []).map(c => ({
            fn: parseExpression(c.expr),
            color: c.color,
            label: c.label,
        })),
        [config.curves]
    );

    const samples = 50;
    const [a, b] = config.xRange;

    // Generate polygon points
    const polygonPoints = useMemo(() => {
        const points: vec.Vector2[] = [];
        const step = (b - a) / samples;

        for (let i = 0; i <= samples; i++) {
            const x = a + i * step;
            points.push([x, upperFn(x)]);
        }
        for (let i = samples; i >= 0; i--) {
            const x = a + i * step;
            points.push([x, lowerFn(x)]);
        }

        return points;
    }, [a, b, lowerFn, upperFn]);

    // Calculate view bounds
    const viewBounds = useMemo(() => {
        let yMin = Infinity, yMax = -Infinity;
        const allFns = [lowerFn, upperFn, ...curveFns.map(c => c.fn)];

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

        const xPad = (b - a) * 0.3;
        const yPad = (yMax - yMin) * 0.3 || 0.5;

        return {
            x: [a - xPad, b + xPad] as [number, number],
            y: [Math.min(0, yMin - yPad), yMax + yPad] as [number, number],
        };
    }, [a, b, lowerFn, upperFn, curveFns]);

    return (
        <Mafs height={height} viewBox={viewBounds}>
            <Coordinates.Cartesian />

            {/* Shaded region */}
            <Polygon
                points={polygonPoints}
                color={Theme.blue}
                fillOpacity={0.25}
            />

            {/* Boundary curves */}
            <Plot.OfX y={lowerFn} color={Theme.blue} />
            <Plot.OfX y={upperFn} color={Theme.red} />

            {/* Additional curves */}
            {curveFns.map((curve, idx) => (
                <Plot.OfX
                    key={idx}
                    y={curve.fn}
                    color={curve.color ?? Theme.foreground}
                />
            ))}

            {/* Vertical boundary lines */}
            <Line.Segment
                point1={[a, lowerFn(a)]}
                point2={[a, upperFn(a)]}
                color={Theme.green}
                style="dashed"
            />
            <Line.Segment
                point1={[b, lowerFn(b)]}
                point2={[b, upperFn(b)]}
                color={Theme.green}
                style="dashed"
            />

            {/* Labels */}
            {config.labels?.map((label, idx) => (
                <Text key={idx} x={label.x} y={label.y} size={12}>
                    {label.text}
                </Text>
            ))}
        </Mafs>
    );
}

// Internal component for function plot visualization
function FunctionPlotRenderer({
    config,
    height,
}: {
    config: FunctionPlotConfig;
    height: number;
}) {
    const fns = useMemo(
        () => config.functions.map(f => ({
            fn: parseExpression(f.expr),
            color: f.color,
            label: f.label,
        })),
        [config.functions]
    );

    const xRange = config.xRange ?? [-5, 5];
    const yRange = config.yRange ?? [-5, 5];

    return (
        <Mafs
            height={height}
            viewBox={{
                x: xRange,
                y: yRange,
            }}
        >
            <Coordinates.Cartesian />
            {fns.map((f, idx) => (
                <Plot.OfX
                    key={idx}
                    y={f.fn}
                    color={f.color ?? Theme.blue}
                />
            ))}
        </Mafs>
    );
}
