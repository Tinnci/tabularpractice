import { useMemo } from "react";
import { useProgressStore } from "@/lib/store";
import { Question } from "@/lib/types";
import { TagNode } from "@/data/subject-tags";

export function useSidebarStats(questions: Question[], currentTags: TagNode[]) {
    // Determine progress source
    const progress = useProgressStore(state => state.progress);

    return useMemo(() => {
        const stats: Record<string, { total: number, finished: number }> = {};

        // Helper function: Get all related questions for a node
        // If leaf, match id; if parent, match all descendant IDs
        const getRelatedQuestions = (node: TagNode): Question[] => {
            // 1. Collect all tag IDs in the node and its subtree
            const relevantTagIds = new Set<string>();
            const collectIds = (n: TagNode) => {
                relevantTagIds.add(n.id);
                if (n.children) {
                    n.children.forEach(collectIds);
                }
            };
            collectIds(node);

            // 2. Filter questions containing any of the IDs
            return questions.filter(q =>
                q.tags.some(tag => relevantTagIds.has(tag))
            );
        };

        const computeStats = (nodes: TagNode[]) => {
            nodes.forEach(node => {
                const relatedQs = getRelatedQuestions(node);
                const total = relatedQs.length;
                const finished = relatedQs.filter(q => {
                    const status = progress[q.id];
                    return status === 'mastered' || status === 'confused' || status === 'failed';
                }).length;

                stats[node.id] = { total, finished };

                if (node.children) {
                    computeStats(node.children);
                }
            });
        };

        if (currentTags && currentTags.length > 0) {
            computeStats(currentTags);
        }

        return stats;
    }, [questions, currentTags, progress]);
}
