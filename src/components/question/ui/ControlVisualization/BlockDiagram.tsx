"use client";

import { useCallback, useMemo } from "react";
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
import type { BlockDiagramConfig, BlockType } from "./types";

export interface BlockDiagramProps extends Omit<BlockDiagramConfig, "type"> {
    height?: number;
    className?: string;
}

// =============== Custom Node Components ===============

/** Transfer Function Block */
function TransferFunctionNode({ data }: NodeProps) {
    return (
        <div className="px-4 py-2 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 rounded shadow-sm min-w-[80px] text-center">
            <Handle type="target" position={Position.Left} className="!bg-blue-500" />
            <div className="text-sm font-mono font-medium text-blue-700 dark:text-blue-300">
                {data.label as string || "G(s)"}
            </div>
            <Handle type="source" position={Position.Right} className="!bg-blue-500" />
        </div>
    );
}

/** Summing Junction (circle with ±) */
function SummingJunctionNode({ data }: NodeProps) {
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

/** Sampler (switch symbol) */
function SamplerNode({ data }: NodeProps) {
    return (
        <div className="relative w-10 h-8 flex items-center justify-center">
            <Handle type="target" position={Position.Left} className="!bg-purple-500" />
            {/* Switch symbol SVG */}
            <svg width="32" height="24" viewBox="0 0 32 24" className="text-purple-600 dark:text-purple-400">
                <circle cx="4" cy="12" r="3" fill="currentColor" />
                <circle cx="28" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                <line x1="7" y1="12" x2="25" y2="6" stroke="currentColor" strokeWidth="2" />
            </svg>
            <Handle type="source" position={Position.Right} className="!bg-purple-500" />
        </div>
    );
}

/** Zero-Order Hold (ZOH) */
function ZohNode({ data }: NodeProps) {
    return (
        <div className="px-3 py-1.5 border-2 border-green-500 bg-green-50 dark:bg-green-950 rounded shadow-sm text-center">
            <Handle type="target" position={Position.Left} className="!bg-green-500" />
            <div className="text-xs font-mono font-medium text-green-700 dark:text-green-300">
                {data.label as string || "ZOH"}
            </div>
            <Handle type="source" position={Position.Right} className="!bg-green-500" />
        </div>
    );
}

/** Gain Block */
function GainNode({ data }: NodeProps) {
    return (
        <div className="w-0 h-0 border-l-[20px] border-l-orange-500 border-y-[12px] border-y-transparent relative">
            <Handle type="target" position={Position.Left} className="!bg-orange-500 !-left-5" />
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {data.label as string || "K"}
            </span>
            <Handle type="source" position={Position.Right} className="!bg-orange-500 !-right-1" />
        </div>
    );
}

/** Input/Output Node */
function IONode({ data }: NodeProps) {
    const isInput = data.nodeType === "input";
    return (
        <div className="px-2 py-1 text-sm font-mono text-gray-600 dark:text-gray-300">
            {isInput ? (
                <>
                    <span>{data.label as string || "R(s)"}</span>
                    <Handle type="source" position={Position.Right} className="!bg-gray-400" />
                </>
            ) : (
                <>
                    <Handle type="target" position={Position.Left} className="!bg-gray-400" />
                    <span>{data.label as string || "C(s)"}</span>
                </>
            )}
        </div>
    );
}

/** Integrator Block */
function IntegratorNode({ data }: NodeProps) {
    return (
        <div className="px-3 py-1.5 border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950 rounded shadow-sm text-center">
            <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
            <div className="text-sm font-mono text-indigo-700 dark:text-indigo-300">
                1/s
            </div>
            <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
        </div>
    );
}

// Node type mapping
const nodeTypes = {
    "transfer-function": TransferFunctionNode,
    "summing-junction": SummingJunctionNode,
    "sampler": SamplerNode,
    "zoh": ZohNode,
    "gain": GainNode,
    "input": IONode,
    "output": IONode,
    "integrator": IntegratorNode,
    "derivative": TransferFunctionNode, // Use same as transfer function for now
};

/**
 * Block Diagram Visualization Component
 * Uses ReactFlow to render control system block diagrams
 */
export function BlockDiagram({
    blocks,
    connections,
    title,
    height = 300,
    className,
}: BlockDiagramProps) {
    // Convert blocks to ReactFlow nodes
    const nodes: Node[] = useMemo(() => {
        return blocks.map((block) => ({
            id: block.id,
            type: block.type,
            position: block.position,
            data: {
                label: block.label,
                nodeType: block.type,
            },
            ...(block.size && {
                style: { width: block.size.width, height: block.size.height },
            }),
        }));
    }, [blocks]);

    // Convert connections to ReactFlow edges
    const edges: Edge[] = useMemo(() => {
        return connections.map((conn, index) => ({
            id: `e-${conn.from}-${conn.to}-${index}`,
            source: conn.from,
            target: conn.to,
            sourceHandle: conn.fromPort === "bottom" ? "bottom" : undefined,
            targetHandle: conn.toPort === "bottom" ? "bottom" : conn.toPort === "top" ? "top" : undefined,
            label: conn.label,
            labelStyle: { fontSize: 10, fontFamily: "monospace" },
            style: {
                stroke: conn.signalType === "discrete" ? "#8b5cf6" : "#64748b",
                strokeDasharray: conn.signalType === "discrete" ? "5,5" : undefined,
            },
            animated: conn.signalType === "discrete",
            markerEnd: { type: "arrowclosed" as const },
        }));
    }, [connections]);

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
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.5}
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
                    <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> 传递函数
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-gray-600 rounded-full"></span> 求和点
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-500 rounded-sm"></span> 采样器
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-sm"></span> ZOH
                </span>
            </div>
        </div>
    );
}
