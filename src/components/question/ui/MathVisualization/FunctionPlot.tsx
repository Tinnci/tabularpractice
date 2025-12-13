"use client";

import { Mafs, Coordinates, Plot, Theme } from "mafs";
import "mafs/core.css";
import { cn } from "@/lib/utils";

export interface FunctionPlotProps {
    /** Function to plot, e.g., "Math.sin(x)" or "x * x" */
    fn: (x: number) => number;
    /** X-axis range [min, max] */
    xRange?: [number, number];
    /** Y-axis range [min, max] */
    yRange?: [number, number];
    /** Line color */
    color?: string;
    /** Additional CSS class */
    className?: string;
    /** Height of the plot in pixels */
    height?: number;
}

/**
 * Simple function plotter using Mafs library.
 * 
 * @example
 * <FunctionPlot fn={(x) => x * x} xRange={[-2, 2]} />
 */
export function FunctionPlot({
    fn,
    xRange = [-5, 5],
    yRange,
    color = Theme.blue,
    className,
    height = 300,
}: FunctionPlotProps) {
    return (
        <div className={cn("w-full rounded-lg overflow-hidden border", className)}>
            <Mafs
                height={height}
                viewBox={{
                    x: xRange,
                    y: yRange ?? [xRange[0], xRange[1]],
                }}
            >
                <Coordinates.Cartesian />
                <Plot.OfX y={fn} color={color} />
            </Mafs>
        </div>
    );
}
