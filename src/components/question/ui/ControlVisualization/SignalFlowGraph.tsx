"use client";

import { useMemo } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    type Node,
    type Edge,
    Position,
    Handle,
    type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import type { SignalFlowGraphConfig } from "./types";

export interface SignalFlowGraphProps extends Omit<SignalFlowGraphConfig, "type"> {
    height?: number;
    className?: string;
}

// =============== Custom Node Components ===============

/** Signal Flow Node - Simple circular node */
function FlowNode({ data }: NodeProps) {
    const isInput = data.nodeType === "input";
    const isOutput = data.nodeType === "output";
    const isSumming = data.nodeType === "summing";

    if (isInput) {
        return (
            <div className="px-3 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-300">
                <span>{data.label as string || "R"}</span>
                <Handle type="source" position={Position.Right} className="!bg-blue-500" />
            </div>
        );
    }

    if (isOutput) {
        return (
            <div className="px-3 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-300">
                <Handle type="target" position={Position.Left} className="!bg-blue-500" />
                <span>{data.label as string || "C"}</span>
            </div>
        );
    }

    if (isSumming) {
        return (
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 dark:border-gray-300 bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                <Handle type="target" position={Position.Left} id="left" className="!bg-gray-600" />
                <Handle type="target" position={Position.Top} id="top" className="!bg-gray-600" />
                <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-gray-600" />
                <span className="text-xs font-bold">Σ</span>
                <Handle type="source" position={Position.Right} className="!bg-gray-600" />
            </div>
        );
    }

    // Regular node - small filled circle
    const label = data.label as string | undefined;

    return (
        <div className="relative">
            <Handle type="target" position={Position.Left} className="!bg-slate-600" />
            <div className="w-3 h-3 rounded-full bg-slate-700 dark:bg-slate-400 border border-slate-900 dark:border-slate-200" />
            {label && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {label}
                </div>
            )}
            <Handle type="source" position={Position.Right} className="!bg-slate-600" />
        </div>
    );
}

// Node type mapping
const nodeTypes = {
    input: FlowNode,
    output: FlowNode,
    node: FlowNode,
    summing: FlowNode,
};

/**
 * Signal Flow Graph Visualization Component
 * Uses ReactFlow to render signal flow diagrams with gain labels
 */
export function SignalFlowGraph({
    nodes: flowNodes,
    edges: flowEdges,
    title,
    height = 300,
    className,
}: SignalFlowGraphProps) {
    // Convert signal flow nodes to ReactFlow nodes
    const nodes: Node[] = useMemo(() => {
        return flowNodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
                label: node.label,
                nodeType: node.type,
            },
        }));
    }, [flowNodes]);

    // Convert signal flow edges to ReactFlow edges
    const edges: Edge[] = useMemo(() => {
        return flowEdges.map((edge, index) => {
            const isCurved = edge.type === "curved";

            return {
                id: `e-${edge.from}-${edge.to}-${index}`,
                source: edge.from,
                target: edge.to,
                label: edge.gain,
                labelStyle: {
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 500,
                    fill: "rgb(59 130 246)", // blue-500
                },
                labelBgStyle: {
                    fill: "rgb(255 255 255)",
                    fillOpacity: 0.9,
                },
                labelBgPadding: [4, 4] as [number, number],
                labelBgBorderRadius: 3,
                type: isCurved ? "smoothstep" : "straight",
                style: {
                    stroke: "rgb(71 85 105)", // slate-600
                    strokeWidth: 1.5,
                },
                markerEnd: {
                    type: "arrowclosed" as const,
                    width: 16,
                    height: 16,
                    color: "rgb(71 85 105)",
                },
                // Apply curve offset for parallel edges
                ...(isCurved && edge.curveOffset !== undefined && {
                    data: { offset: edge.curveOffset },
                }),
            };
        });
    }, [flowEdges]);

    return (
        <div className={cn("rounded-lg border bg-background overflow-hidden", className)}>
            {title && (
                <div className="px-3 py-2 text-sm font-medium border-b bg-muted/30">
                    {title}
                </div>
            )}
            <div style={{ width: "100%", height }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.3}
                    maxZoom={2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag
                    zoomOnScroll
                    attributionPosition="bottom-left"
                >
                    <Controls showInteractive={false} />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                </ReactFlow>
            </div>
            {/* Legend */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-900"></span> 节点
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-gray-600 rounded-full"></span> 求和点
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">G(s)</span> = 传递增益
            </div>
        </div>
    );
}
