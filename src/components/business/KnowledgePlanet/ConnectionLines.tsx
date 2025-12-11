import React, { useMemo } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';

interface ProjectedNode {
    node: EnhancedTagNode;
    x: number;
    y: number;
    // z, scale, opacity might be removed or optional, let's keep it simple for 2D
}

interface ConnectionLinesProps {
    nodes: ProjectedNode[];
    hoveredNodeId: string | null;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ nodes, hoveredNodeId }) => {
    // Build a map for fast lookup of positions by ID
    const nodeMap = useMemo(() => {
        const map = new Map<string, { x: number; y: number }>();
        nodes.forEach(n => {
            map.set(n.node.id, { x: n.x, y: n.y });
        });
        return map;
    }, [nodes]);

    const lines = useMemo(() => {
        const result: React.ReactNode[] = [];
        const drawnConnections = new Set<string>();

        nodes.forEach(source => {
            // Draw connections to parent
            if (source.node.parentId && nodeMap.has(source.node.parentId)) {
                const targetPos = nodeMap.get(source.node.parentId)!;
                const connectionId = [source.node.id, source.node.parentId].sort().join('-');


                if (!drawnConnections.has(connectionId)) {
                    drawnConnections.add(connectionId);

                    const isHoveredChain =
                        hoveredNodeId && (source.node.id === hoveredNodeId || source.node.parentId === hoveredNodeId);

                    result.push(
                        <line
                            key={connectionId}
                            x1={source.x}
                            y1={source.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke="currentColor"
                            strokeWidth={isHoveredChain ? 2 : 1}
                            className={`${isHoveredChain ? 'text-primary/60' : 'text-border/40'} transition-colors duration-300`}
                        />
                    );
                }
            }
        });

        return result;
    }, [nodes, nodeMap, hoveredNodeId]);

    return (
        <svg className="absolute top-1/2 left-1/2 overflow-visible pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
            {/* Center is 0,0 in our coordinate system, but SVG usually starts top-left.
                 The parent <div> centers this <svg> with translate.
                 We need to ensure coordinates match.
                 Our nodes are x,y relative to center.
                 So <line x1={x} ... /> should work if SVG viewbox is centered or overflow visible.
                 However, <line> inside <svg> expects coordinates relative to SVG origin.
                 If SVG is 0x0 with overflow visible, x=100 will range to right.
             */}
            {lines}
        </svg>
    );
};
