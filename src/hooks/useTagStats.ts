import { useMemo } from 'react';
import { Question } from '@/lib/types';
import { TagNode, SUBJECT_TAGS_MAP } from '@/data/subject-tags';

export interface TagStats {
    total: number;
    mastered: number;
    confused: number;
    failed: number;
    unanswered: number;
}

export interface EnhancedTagNode {
    id: string;
    label: string;
    parentId: string | null;
    depth: number;
    stats: TagStats;
    computed: {
        weaknessScore: number; // 0-1
        priority: 'low' | 'medium' | 'high' | 'critical';
        sizeMultiplier: number; // 1-3
    };
    children?: EnhancedTagNode[];
}

export function useTagStats(questions: Question[], subjectKey: string = 'math') {
    const statsMap = useMemo(() => {
        const map = new Map<string, TagStats>();

        questions.forEach(q => {
            q.tags?.forEach(tagId => {
                if (!map.has(tagId)) {
                    map.set(tagId, { total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0 });
                }
                const stats = map.get(tagId)!;
                stats.total++;

                // q.status is injected in merging, assume 'mastered' | 'confused' | 'failed' | 'unanswered'
                // contextQuestions returns mergedQuestions which has status.
                const status = (q as Question & { status?: string }).status || 'unanswered';

                if (status === 'mastered') stats.mastered++;
                else if (status === 'confused') stats.confused++;
                else if (status === 'failed') stats.failed++;
                else stats.unanswered++;
            });
        });

        return map;
    }, [questions]);

    const enhancedTags = useMemo(() => {
        const rootTags = SUBJECT_TAGS_MAP[subjectKey] || {};
        // If subjectKey not found (e.g. 'all'), we might want to combine all?
        // For now, let's assume we pass a valid key or handle undefined.
        // If subjectKey is 'all' or empty, we might need a different strategy.
        // But for typical use case, let's start with 'math' or current subject.

        // Actually, questions might be from mixed subjects if user selects 'all'. 
        // But the Knowledge Graph usually makes sense per subject.
        // Let's iterate all known tags if subject is not specific.

        const nodesToProcess: TagNode[] = Array.isArray(rootTags) ? rootTags : Object.values(SUBJECT_TAGS_MAP).flat();

        const processNode = (node: TagNode, parentId: string | null, depth: number): EnhancedTagNode => {
            const stats = statsMap.get(node.id) || { total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0 };

            // Calculate weakness score
            // (failed * 2 + confused * 1) / total_answered
            const totalAnswered = stats.mastered + stats.confused + stats.failed;
            let weaknessScore = 0;
            if (totalAnswered > 0) {
                weaknessScore = (stats.failed * 2 + stats.confused) / (totalAnswered * 2);
                // Normalize: max score is if all failed -> 2/2 = 1.
            }

            // Priority
            let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
            if (weaknessScore > 0.7) priority = 'critical';
            else if (weaknessScore > 0.4) priority = 'high';
            else if (weaknessScore > 0.1) priority = 'medium';

            // Size multiplier based on question volume relative to average? 
            // Or just log scale.
            // Let's use simple log scale for now.
            const sizeMultiplier = Math.min(3, Math.max(1, Math.log2(stats.total + 1)));

            const enhancedNode: EnhancedTagNode = {
                id: node.id,
                label: node.label,
                parentId,
                depth,
                stats,
                computed: {
                    weaknessScore,
                    priority,
                    sizeMultiplier
                }
            };

            if (node.children) {
                enhancedNode.children = node.children.map(child => processNode(child, node.id, depth + 1));

                // Optional: Aggregate stats from children to parent?
                // Usually parent tag might not have direct questions, or it might.
                // If parent has no stats but children do, should we aggregate?
                // Let's keep it simple: strict mapping first.
            }

            return enhancedNode;
        };

        return nodesToProcess.map(node => processNode(node, null, 0));

    }, [statsMap, subjectKey]);

    // Flatten for easy 3D rendering list
    const flatEnhancedTags = useMemo(() => {
        const flat: EnhancedTagNode[] = [];
        const traverse = (nodes: EnhancedTagNode[]) => {
            nodes.forEach(node => {
                // If we want detailed view, we include all nodes.
                // Maybe filter out nodes with 0 questions if we want a cleaner graph?
                // For now include all to show structure, or at least structure nodes.
                if (node.stats.total > 0 || (node.children && node.children.length > 0)) {
                    flat.push(node);
                }
                if (node.children) traverse(node.children);
            });
        };
        traverse(enhancedTags);
        return flat;
    }, [enhancedTags]);

    return { enhancedTags, flatEnhancedTags };
}
