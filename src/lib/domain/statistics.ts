/**
 * Domain logic for statistical calculations
 * Pure functions for data processing and analysis
 */

import { Question } from '@/lib/types';
import { TagNode, normalizeTagId } from '@/data/subject-tags';

// ========== Types ==========

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

// ========== Statistics Calculation ==========

/**
 * Calculate tag statistics from a list of questions
 * Pure function: same input always produces same output
 */
export function calculateTagStats(questions: Question[]): Map<string, TagStats> {
    const map = new Map<string, TagStats>();

    questions.forEach(q => {
        q.tags?.forEach(rawTagId => {
            // Normalize Pinyin IDs to Standard IDs for consistent matching
            const tagId = normalizeTagId(rawTagId);

            if (!map.has(tagId)) {
                map.set(tagId, { total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0 });
            }
            const stats = map.get(tagId)!;
            stats.total++;

            // q.status is injected in merging, assume 'mastered' | 'confused' | 'failed' | 'unanswered'
            const status = (q as Question & { status?: string }).status || 'unanswered';

            if (status === 'mastered') stats.mastered++;
            else if (status === 'confused') stats.confused++;
            else if (status === 'failed') stats.failed++;
            else stats.unanswered++;
        });
    });

    return map;
}

/**
 * Calculate weakness score based on tag statistics
 * Higher score = more weakness (more failed/confused questions)
 */
export function calculateWeaknessScore(stats: TagStats): number {
    const totalAnswered = stats.mastered + stats.confused + stats.failed;
    if (totalAnswered === 0) return 0;

    // (failed * 2 + confused * 1) / (totalAnswered * 2)
    // Max score is 1 if all questions are failed
    return (stats.failed * 2 + stats.confused) / (totalAnswered * 2);
}

/**
 * Determine priority level based on weakness score
 */
export function calculatePriority(weaknessScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (weaknessScore > 0.7) return 'critical';
    if (weaknessScore > 0.4) return 'high';
    if (weaknessScore > 0.1) return 'medium';
    return 'low';
}

/**
 * Calculate size multiplier based on total question count
 * Uses logarithmic scale for better visual representation
 */
export function calculateSizeMultiplier(total: number): number {
    return Math.min(3, Math.max(1, Math.log2(total + 1)));
}

// ========== Tree Processing ==========

/**
 * Recursively enhance tag tree with statistics and computed metrics
 */
export function enhanceTagTree(
    nodes: TagNode[],
    statsMap: Map<string, TagStats>,
    parentId: string | null = null,
    depth: number = 0
): EnhancedTagNode[] {
    return nodes.map(node => processTagNode(node, statsMap, parentId, depth));
}

function processTagNode(
    node: TagNode,
    statsMap: Map<string, TagStats>,
    parentId: string | null,
    depth: number
): EnhancedTagNode {
    const stats = statsMap.get(node.id) || { total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0 };

    const weaknessScore = calculateWeaknessScore(stats);
    const priority = calculatePriority(weaknessScore);
    const sizeMultiplier = calculateSizeMultiplier(stats.total);

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
        enhancedNode.children = enhanceTagTree(
            node.children,
            statsMap,
            node.id,
            depth + 1
        );
    }

    return enhancedNode;
}

/**
 * Flatten enhanced tag tree for easy iteration
 * Filters out nodes with no questions (unless they have children)
 */
export function flattenEnhancedTags(nodes: EnhancedTagNode[]): EnhancedTagNode[] {
    const flat: EnhancedTagNode[] = [];

    const traverse = (currentNodes: EnhancedTagNode[]) => {
        currentNodes.forEach(node => {
            // Include nodes that have questions or have children
            if (node.stats.total > 0 || (node.children && node.children.length > 0)) {
                flat.push(node);
            }
            if (node.children) {
                traverse(node.children);
            }
        });
    };

    traverse(nodes);
    return flat;
}

// ========== Data Deduplication ==========

/**
 * Deduplicate questions by ID
 * When duplicate IDs are found, keeps the first occurrence
 */
export function deduplicateQuestions(questions: Question[]): Question[] {
    const uniqueQuestions = new Map<string, Question>();

    questions.forEach(q => {
        if (!uniqueQuestions.has(q.id)) {
            uniqueQuestions.set(q.id, q);
        }
    });

    return Array.from(uniqueQuestions.values());
}

/**
 * Deduplicate paper groups by ID
 * Generic function that works with any object that has an 'id' property
 * When duplicate IDs are found, keeps the first occurrence
 */
export function deduplicatePaperGroups<T extends { id: string }>(groups: T[]): T[] {
    const uniqueGroups = new Map<string, T>();

    groups.forEach(group => {
        if (!uniqueGroups.has(group.id)) {
            uniqueGroups.set(group.id, group);
        }
    });

    return Array.from(uniqueGroups.values());
}

/**
 * Filter questions by hidden papers and groups
 */
export function filterQuestions(
    questions: Question[],
    hiddenPaperIds: string[] = [],
    hiddenGroupIds: string[] = []
): Question[] {
    let filtered = questions;

    // Filter hidden papers
    if (hiddenPaperIds.length > 0) {
        filtered = filtered.filter(q => !hiddenPaperIds.includes(q.paperId));
    }

    // Filter hidden groups (paperId format is usually "groupId-year")
    if (hiddenGroupIds.length > 0) {
        filtered = filtered.filter(q => {
            return !hiddenGroupIds.some(groupId => q.paperId.startsWith(groupId));
        });
    }

    return filtered;
}
