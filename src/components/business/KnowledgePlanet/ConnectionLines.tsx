import React, { useMemo } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';

interface ConnectionLinesProps {
    nodes: { node: EnhancedTagNode; x: number; y: number; z: number }[];
    hoveredNodeId?: string | null;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ nodes, hoveredNodeId }) => {
    // We need to map node ID to its 3D position for drawing lines
    const positionMap = useMemo(() => {
        const map = new Map<string, { x: number; y: number; z: number }>();
        nodes.forEach(n => map.set(n.node.id, { x: n.x, y: n.y, z: n.z }));
        return map;
    }, [nodes]);

    const lines = useMemo(() => {
        const result: React.JSX.Element[] = [];

        nodes.forEach(current => {
            const parentId = current.node.parentId;
            if (parentId && positionMap.has(parentId)) {
                const parentPos = positionMap.get(parentId)!;

                // Opacity based on Z-depth (simplified) and interaction
                const isRelated = hoveredNodeId && (current.node.id === hoveredNodeId || parentId === hoveredNodeId);

                // Calculate average Z for z-indexing the line? SVG doesn't support z-index same as HTML div.
                // We usually just draw them.

                const style = isRelated ? { stroke: 'rgba(var(--primary), 0.6)', strokeWidth: 2 } : { stroke: 'rgba(150, 150, 150, 0.1)', strokeWidth: 1 };

                result.push(
                    <line
                        key={`${current.node.id}-${parentId}`}
                        x1={current.x}
                        y1={current.y}
                        x2={parentPos.x}
                        y2={parentPos.y}
                        style={style}
                    />
                );
            }
        });
        return result;
    }, [nodes, positionMap, hoveredNodeId]);

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
