import React, { useMemo } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';

interface ProjectedNode {
    node: EnhancedTagNode;
    x: number;
    y: number;
}

interface ConnectionLinesProps {
    nodes: ProjectedNode[];
    hoveredNodeId: string | null;
}

/**
 * 计算贝塞尔曲线的控制点
 * 使用垂直于连线方向的偏移来创建自然的曲线
 */
function calculateBezierPath(
    x1: number, y1: number,
    x2: number, y2: number
): string {
    // 计算中点
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // 计算连线长度用于决定曲率
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 曲率：短连线用更小的曲率，长连线稍微弯曲一点
    const curvature = Math.min(length * 0.15, 30);

    // 垂直方向的单位向量（用于偏移控制点）
    const perpX = -dy / length;
    const perpY = dx / length;

    // 控制点：在中点位置，垂直偏移
    const cpX = midX + perpX * curvature;
    const cpY = midY + perpY * curvature;

    return `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
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

    // 计算所有节点的边界，用于确定 SVG viewBox
    const bounds = useMemo(() => {
        if (nodes.length === 0) return { minX: -100, maxX: 100, minY: -100, maxY: 100 };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });

        // 添加 padding
        const padding = 50;
        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding
        };
    }, [nodes]);

    const paths = useMemo(() => {
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

                    // 使用贝塞尔曲线路径
                    const pathD = calculateBezierPath(
                        source.x, source.y,
                        targetPos.x, targetPos.y
                    );

                    result.push(
                        <path
                            key={connectionId}
                            d={pathD}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={isHoveredChain ? 2.5 : 1}
                            strokeLinecap="round"
                            className={`${isHoveredChain ? 'text-primary/70' : 'text-border/30'} transition-all duration-300`}
                            style={{
                                filter: isHoveredChain ? 'drop-shadow(0 0 3px currentColor)' : 'none'
                            }}
                        />
                    );
                }
            }
        });

        return result;
    }, [nodes, nodeMap, hoveredNodeId]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    return (
        <svg
            className="absolute overflow-visible pointer-events-none"
            width={width}
            height={height}
            viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
            style={{
                left: bounds.minX,
                top: bounds.minY,
            }}
        >
            {paths}
        </svg>
    );
};
