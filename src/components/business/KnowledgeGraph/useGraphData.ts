"use client";

import { useMemo } from 'react';
import { type Node, type Edge, MarkerType } from '@xyflow/react';
import { useTagStats, EnhancedTagNode } from '@/hooks/useTagStats';
import { Question } from '@/lib/types';
import { getLayoutedElements } from './layout';

interface UseGraphDataOptions {
    questions: Question[];
    subjectKey: string;
}

// 根据 weakness score 计算颜色
function getNodeColors(weaknessScore: number, total: number): { bg: string; border: string } {
    if (total === 0) {
        // 未开始
        return { bg: '#f3f4f6', border: '#d1d5db' };
    }

    if (weaknessScore < 0.3) {
        // 掌握良好 (绿色)
        return { bg: '#dcfce7', border: '#86efac' };
    } else if (weaknessScore < 0.6) {
        // 中等 (黄色)
        return { bg: '#fef9c3', border: '#fde047' };
    } else {
        // 薄弱 (红色)
        return { bg: '#fee2e2', border: '#fca5a5' };
    }
}

export function useGraphData({ questions, subjectKey }: UseGraphDataOptions) {
    // 使用 useTagStats 获取增强的标签树
    const { enhancedTags } = useTagStats(questions, subjectKey);

    const { nodes, edges } = useMemo(() => {
        const rawNodes: Node[] = [];
        const rawEdges: Edge[] = [];

        // 递归遍历增强的标签树
        const traverse = (tagNodes: EnhancedTagNode[], parentId?: string) => {
            tagNodes.forEach(tag => {
                const colors = getNodeColors(tag.computed.weaknessScore, tag.stats.total);

                // 创建节点
                rawNodes.push({
                    id: tag.id,
                    data: {
                        label: tag.label,
                        stats: tag.stats,
                        priority: tag.computed.priority,
                    },
                    position: { x: 0, y: 0 },
                    style: {
                        background: colors.bg,
                        border: `2px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: tag.depth === 0 ? '14px' : '12px',
                        fontWeight: tag.depth === 0 ? 600 : 400,
                        textAlign: 'center' as const,
                        width: tag.depth === 0 ? 160 : 140,
                    },
                });

                // 创建连线
                if (parentId) {
                    rawEdges.push({
                        id: `${parentId}-${tag.id}`,
                        source: parentId,
                        target: tag.id,
                        type: 'smoothstep',
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#9ca3af',
                            width: 15,
                            height: 15,
                        },
                        style: { stroke: '#9ca3af', strokeWidth: 1.5 },
                    });
                }

                // 递归处理子节点
                if (tag.children && tag.children.length > 0) {
                    traverse(tag.children, tag.id);
                }
            });
        };

        traverse(enhancedTags);

        // 应用 Dagre 布局 (从左到右)
        return getLayoutedElements(rawNodes, rawEdges, 'LR');
    }, [enhancedTags]);

    return { nodes, edges };
}
