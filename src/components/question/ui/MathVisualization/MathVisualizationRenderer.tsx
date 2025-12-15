"use client";

import { useMemo, Suspense, lazy } from "react";
import { cn } from "@/lib/utils";
import {
    IntegralRegion2D,
    EnhancedFunctionPlot,
    VectorField2D,
    ParametricCurve2D
} from ".";

import {
    IntegralRegion2DConfig,
    EnhancedFunctionPlotConfig,
    ParametricCurve2DConfig,
    VectorField2DConfig,
    SurfacePlot3DConfig,
    VectorField3DConfig,
    ClosedSurface3DConfig,
    Gradient3DConfig,
    MathVisualizationRendererProps
} from "./types";

// Lazy load 3D components for code splitting
const SurfacePlot3D = lazy(() => import("./SurfacePlot3D").then(m => ({ default: m.SurfacePlot3D })));
const VectorField3DVisualizer = lazy(() => import("./VectorField3D").then(m => ({ default: m.VectorField3DVisualizer })));
const ClosedSurface3D = lazy(() => import("./VectorField3D").then(m => ({ default: m.ClosedSurface3D })));
const Gradient3DVisualizer = lazy(() => import("./Gradient3D").then(m => ({ default: m.Gradient3DVisualizer })));

// Re-export types for consumers
export type {
    VisualizationConfig,
    MathVisualizationRendererProps,
    IntegralRegion2DConfig,
    FunctionPlotConfig,
    SurfacePlot3DConfig,
    VectorField3DConfig,
    ClosedSurface3DConfig,
    Gradient3DConfig
} from "./types";

// 3D Loading fallback
function Viz3DLoading() {
    return (
        <div className="w-full h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg border">
            <div className="text-sm text-muted-foreground animate-pulse">
                🔄 加载 3D 可视化...
            </div>
        </div>
    );
}

/**
 * Universal renderer for mathematical visualizations.
 * Parses configuration from eureka data and renders appropriate visualization.
 * Supports both 2D (Mafs) and 3D (Three.js) visualizations.
 */
export function MathVisualizationRenderer({
    config,
    height = 300,
    className,
}: MathVisualizationRendererProps) {
    const visualization = useMemo(() => {
        // ================= 2D Visualizations (Viz2DContainer automatically handled by components) =================

        if (config.type === "function-plot") {
            const cfg = config.config as EnhancedFunctionPlotConfig;
            // Map dotted style to dashed as Mafs doesn't support dotted directly
            const mappedFunctions = cfg.functions.map(f => ({
                ...f,
                style: (f.style === "dotted" ? "dashed" : f.style) as "solid" | "dashed" | undefined
            }));

            return (
                <EnhancedFunctionPlot
                    functions={mappedFunctions}
                    xRange={cfg.xRange}
                    yRange={cfg.yRange}
                    criticalPoints={cfg.criticalPoints}
                    asymptotes={cfg.asymptotes}
                    shadedRegions={cfg.shadedRegions}
                    showControls={cfg.showControls !== false}
                    showLegend={cfg.showLegend !== false}
                    height={height}
                />
            );
        }

        if (config.type === "integral-region-2d") {
            const cfg = config.config as IntegralRegion2DConfig;
            return (
                <IntegralRegion2D
                    lowerBound={cfg.lowerBound}
                    upperBound={cfg.upperBound}
                    xRange={cfg.xRange}
                    curves={cfg.curves?.map(c => ({
                        fn: c.expr,
                        color: c.color,
                        label: c.label
                    }))}
                    height={height}
                />
            );
        }

        if (config.type === "vector-field-2d") {
            const cfg = config.config as VectorField2DConfig;
            return (
                <VectorField2D
                    fx={cfg.fx}
                    fy={cfg.fy}
                    xRange={cfg.xRange}
                    yRange={cfg.yRange}
                    density={cfg.density}
                    showLegend={cfg.showStreamlines} // Mapping showStreamlines to legend/info for now
                    height={height}
                />
            );
        }

        if (config.type === "parametric-curve-2d" || config.type === "parametric") {
            const cfg = config.config as ParametricCurve2DConfig;
            return (
                <ParametricCurve2D
                    x={cfg.x}
                    y={cfg.y}
                    tRange={cfg.tRange}
                    color={cfg.color}
                    showDirection={cfg.showDirection}
                    height={height}
                />
            );
        }

        // ================= 3D Visualizations (Lazy Loaded) =================

        if (config.type === "surface-plot-3d") {
            const cfg = config.config as SurfacePlot3DConfig;
            return (
                <Suspense fallback={<Viz3DLoading />}>
                    <SurfacePlot3D
                        function={cfg.function}
                        xRange={cfg.xRange}
                        yRange={cfg.yRange}
                        colorScheme={cfg.colorScheme}
                        opacity={cfg.opacity}
                        showWireframe={cfg.showWireframe}
                        criticalPoints={cfg.criticalPoints}
                        height={400} // Force consistent height for 3D
                    />
                </Suspense>
            );
        }

        if (config.type === "vector-field-3d") {
            const cfg = config.config as VectorField3DConfig;
            return (
                <Suspense fallback={<Viz3DLoading />}>
                    <VectorField3DVisualizer
                        fx={cfg.fx}
                        fy={cfg.fy}
                        fz={cfg.fz}
                        range={cfg.range}
                        density={cfg.density}
                        showDivergence={cfg.showDivergence}
                        height={400}
                    />
                </Suspense>
            );
        }

        if (config.type === "closed-surface-3d") {
            const cfg = config.config as ClosedSurface3DConfig;
            return (
                <Suspense fallback={<Viz3DLoading />}>
                    <ClosedSurface3D
                        surface={cfg.surface}
                        params={cfg.params}
                        vectorField={cfg.vectorField}
                        showFluxArrows={cfg.showFluxArrows}
                        showVolume={cfg.showVolume}
                        height={400}
                    />
                </Suspense>
            );
        }

        if (config.type === "gradient-3d") {
            const cfg = config.config as Gradient3DConfig;
            return (
                <Suspense fallback={<Viz3DLoading />}>
                    <Gradient3DVisualizer
                        function={cfg.function}
                        point={cfg.point}
                        showLevelSurface={cfg.showLevelSurface}
                        showGradientVector={cfg.showGradientVector}
                        showDirectionalDerivative={cfg.showDirectionalDerivative}
                        range={cfg.range}
                        height={400}
                    />
                </Suspense>
            );
        }

        return (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg border">
                <span className="text-muted-foreground">Visualization type &quot;{config.type}&quot; not yet implemented</span>
            </div>
        );
    }, [config, height]);

    const is3D = config.type.endsWith("-3d");

    return (
        <div className={cn("space-y-2", className)}>
            {config.title && (
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {config.title}
                    {is3D && <span className="text-xs text-primary/60">(拖拽旋转)</span>}
                </div>
            )}

            {/* The visualization component itself (which includes its own container/border) */}
            {visualization}
        </div>
    );
}
