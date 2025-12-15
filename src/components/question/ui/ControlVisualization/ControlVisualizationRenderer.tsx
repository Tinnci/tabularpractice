"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
    ControlVisualizationRendererProps,
    BodePlotConfig,
    BlockDiagramConfig,
    CircuitDiagramConfig,
    RootLocusConfig,
    SignalFlowGraphConfig,
    StepResponseConfig,
} from "./types";
import { StepResponse } from "./StepResponse";
import { BodePlot } from "./BodePlot";
import { BlockDiagram } from "./BlockDiagram";
import { CircuitDiagram } from "./CircuitDiagram";
import { RootLocus } from "./RootLocus";
import { SignalFlowGraph } from "./SignalFlowGraph";

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
        // Extract inner config from nested structure
        const innerConfig = config.config;

        switch (config.type) {
            case "step-response":
                return (
                    <StepResponse
                        systemType={(innerConfig as StepResponseConfig).systemType}
                        timeConstant={(innerConfig as StepResponseConfig).timeConstant}
                        gain={(innerConfig as StepResponseConfig).gain}
                        dampingRatio={(innerConfig as StepResponseConfig).dampingRatio}
                        naturalFrequency={(innerConfig as StepResponseConfig).naturalFrequency}
                        customExpression={(innerConfig as StepResponseConfig).customExpression}
                        tRange={(innerConfig as StepResponseConfig).tRange}
                        yRange={(innerConfig as StepResponseConfig).yRange}
                        annotations={(innerConfig as StepResponseConfig).annotations}
                        showGrid={(innerConfig as StepResponseConfig).showGrid}
                        height={height}
                    />
                );


            case "bode-plot":
                return (
                    <BodePlot
                        transferFunction={(innerConfig as BodePlotConfig).transferFunction}
                        omegaRange={(innerConfig as BodePlotConfig).omegaRange}
                        showAsymptotes={(innerConfig as BodePlotConfig).showAsymptotes}
                        showPhaseMargin={(innerConfig as BodePlotConfig).showPhaseMargin}
                        showGainMargin={(innerConfig as BodePlotConfig).showGainMargin}
                        annotations={(innerConfig as BodePlotConfig).annotations}
                        height={height}
                    />
                );

            case "block-diagram":
                return (
                    <BlockDiagram
                        blocks={(innerConfig as BlockDiagramConfig).blocks}
                        connections={(innerConfig as BlockDiagramConfig).connections}
                        title={(innerConfig as BlockDiagramConfig).title}
                        height={height}
                    />
                );

            case "circuit-diagram":
                return (
                    <CircuitDiagram
                        components={(innerConfig as CircuitDiagramConfig).components}
                        connections={(innerConfig as CircuitDiagramConfig).connections}
                        annotations={(innerConfig as CircuitDiagramConfig).annotations}
                        inputLabel={(innerConfig as CircuitDiagramConfig).inputLabel}
                        outputLabel={(innerConfig as CircuitDiagramConfig).outputLabel}
                        height={height}
                    />
                );

            case "root-locus":
                return (
                    <RootLocus
                        openLoopPoles={(innerConfig as RootLocusConfig).openLoopPoles}
                        openLoopZeros={(innerConfig as RootLocusConfig).openLoopZeros}
                        asymptotes={(innerConfig as RootLocusConfig).asymptotes}
                        separationPoints={(innerConfig as RootLocusConfig).separationPoints}
                        imaginaryAxisCrossings={(innerConfig as RootLocusConfig).imaginaryAxisCrossings}
                        branches={(innerConfig as RootLocusConfig).branches}
                        kRange={(innerConfig as RootLocusConfig).kRange}
                        realAxisRange={(innerConfig as RootLocusConfig).realAxisRange}
                        imagAxisRange={(innerConfig as RootLocusConfig).imagAxisRange}
                        showArrows={(innerConfig as RootLocusConfig).showArrows}
                        showKValues={(innerConfig as RootLocusConfig).showKValues}
                        height={height}
                    />
                );

            case "signal-flow-graph":
                return (
                    <SignalFlowGraph
                        nodes={(innerConfig as SignalFlowGraphConfig).nodes}
                        edges={(innerConfig as SignalFlowGraphConfig).edges}
                        title={(innerConfig as SignalFlowGraphConfig).title}
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
