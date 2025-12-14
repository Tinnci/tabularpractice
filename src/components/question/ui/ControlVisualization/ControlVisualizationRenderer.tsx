"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ControlVisualizationRendererProps } from "./types";
import { StepResponse } from "./StepResponse";
import { BodePlot } from "./BodePlot";
import { BlockDiagram } from "./BlockDiagram";
import { CircuitDiagram } from "./CircuitDiagram";
import { RootLocus } from "./RootLocus";

function NotImplemented({ type }: { type: string }) {
    return (
        <div className="w-full h-48 flex items-center justify-center bg-muted/30 rounded-lg border">
            <div className="text-sm text-muted-foreground">
                📊 可视化类型 &quot;{type}&quot; 尚未实现
            </div>
        </div>
    );
}

/**
 * Universal renderer for control theory visualizations
 * Supports circuit diagrams, block diagrams, root locus, Bode plots, etc.
 */
export function ControlVisualizationRenderer({
    config,
    height = 300,
    className,
}: ControlVisualizationRendererProps) {
    const visualization = useMemo(() => {
        switch (config.type) {
            case "step-response":
                return (
                    <StepResponse
                        systemType={config.systemType}
                        timeConstant={config.timeConstant}
                        gain={config.gain}
                        dampingRatio={config.dampingRatio}
                        naturalFrequency={config.naturalFrequency}
                        customExpression={config.customExpression}
                        tRange={config.tRange}
                        yRange={config.yRange}
                        annotations={config.annotations}
                        showGrid={config.showGrid}
                        height={height}
                    />
                );

            case "bode-plot":
                return (
                    <BodePlot
                        transferFunction={config.transferFunction}
                        omegaRange={config.omegaRange}
                        showAsymptotes={config.showAsymptotes}
                        showPhaseMargin={config.showPhaseMargin}
                        showGainMargin={config.showGainMargin}
                        annotations={config.annotations}
                        height={height}
                    />
                );

            case "block-diagram":
                return (
                    <BlockDiagram
                        blocks={config.blocks}
                        connections={config.connections}
                        title={config.title}
                        height={height}
                    />
                );

            case "circuit-diagram":
                return (
                    <CircuitDiagram
                        components={config.components}
                        connections={config.connections}
                        annotations={config.annotations}
                        inputLabel={config.inputLabel}
                        outputLabel={config.outputLabel}
                        height={height}
                    />
                );

            case "root-locus":
                return (
                    <RootLocus
                        openLoopPoles={config.openLoopPoles}
                        openLoopZeros={config.openLoopZeros}
                        asymptotes={config.asymptotes}
                        separationPoints={config.separationPoints}
                        imaginaryAxisCrossings={config.imaginaryAxisCrossings}
                        branches={config.branches}
                        kRange={config.kRange}
                        realAxisRange={config.realAxisRange}
                        imagAxisRange={config.imagAxisRange}
                        showArrows={config.showArrows}
                        showKValues={config.showKValues}
                        height={height}
                    />
                );

            case "nyquist-plot":
            case "phase-portrait":
            case "state-transition":
                return <NotImplemented type={config.type} />;

            default:
                return <NotImplemented type={(config as { type: string }).type} />;
        }
    }, [config, height]);

    return (
        <div className={cn("space-y-2", className)}>
            {visualization}
        </div>
    );
}
