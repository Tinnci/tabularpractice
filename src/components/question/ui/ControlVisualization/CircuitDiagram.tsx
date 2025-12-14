"use client";

import { cn } from "@/lib/utils";
import type { CircuitDiagramConfig } from "./types";

interface CircuitDiagramProps extends Omit<CircuitDiagramConfig, "type"> {
    height?: number;
    className?: string;
}

/**
 * Circuit Diagram Visualization Component
 * TODO: Implement using custom SVG components for R, L, C elements
 */
export function CircuitDiagram({
    components,
    connections,
    annotations,
    inputLabel,
    outputLabel,
    height = 250,
    className,
}: CircuitDiagramProps) {
    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30">
                电路图 / Circuit Diagram
            </div>
            <div
                className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/50"
                style={{ height }}
            >
                <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="text-sm">电路图组件开发中...</div>
                    <div className="text-xs mt-1">
                        {components.length} 个元件
                    </div>
                </div>
            </div>
            {/* Component summary */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-2">
                {inputLabel && <span>输入: {inputLabel}</span>}
                {outputLabel && <span>输出: {outputLabel}</span>}
                <span>
                    元件: {components.map(c => c.label ?? c.type).join(", ")}
                </span>
            </div>
        </div>
    );
}
