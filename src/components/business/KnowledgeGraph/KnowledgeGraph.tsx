"use client";

import { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Question } from '@/lib/types';
import { useGraphData } from './useGraphData';

interface KnowledgeGraphProps {
    questions: Question[];
    subjectKey?: string;
    onNodeClick?: (tagId: string, tagLabel: string) => void;
    className?: string;
}

export function KnowledgeGraph({
    questions,
    subjectKey = 'math',
    onNodeClick,
    className,
}: KnowledgeGraphProps) {
    const { nodes: initialNodes, edges: initialEdges } = useGraphData({
        questions,
        subjectKey,
    });

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    const handleNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (onNodeClick) {
                onNodeClick(node.id, node.data.label as string);
            }
        },
        [onNodeClick]
    );

    return (
        <div className={className} style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                attributionPosition="bottom-left"
            >
                <Controls />
                <MiniMap
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                />
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
        </div>
    );
}
