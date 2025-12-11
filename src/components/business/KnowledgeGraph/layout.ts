
import * as dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const nodeWidth = 180;
const nodeHeight = 50;

/**
 * 使用 Dagre 算法对节点进行自动布局
 * @param nodes 原始节点
 * @param edges 原始边
 * @param direction 布局方向 'TB' (Top-Bottom) | 'LR' (Left-Right)
 */
export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    direction = 'TB'
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // 微调坐标，使其居中
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // 我们需要传递一个新的 position 对象以通知 React Flow 更新变化
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};
