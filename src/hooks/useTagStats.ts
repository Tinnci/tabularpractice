/**
 * Hook for calculating and managing tag statistics
 * Connects Store data with domain logic
 */

import { useMemo } from 'react';
import { Question } from '@/lib/types';
import { SUBJECT_TAGS_MAP } from '@/data/subject-tags';
import {
    TagStats,
    EnhancedTagNode,
    calculateTagStats,
    enhanceTagTree,
    flattenEnhancedTags
} from '@/lib/domain/statistics';

// Re-export types for backward compatibility
export type { TagStats, EnhancedTagNode };

/**
 * Calculate tag statistics and enhanced tag nodes for visualization
 * 
 * @param questions - Array of questions to analyze
 * @param subjectKey - Subject key ('math', 'english', etc.) or 'all' for mixed
 * @returns Enhanced tag tree and flattened list
 */
export function useTagStats(questions: Question[], subjectKey: string = 'math') {
    // Step 1: Calculate raw statistics (pure function, memoized)
    const statsMap = useMemo(() => {
        return calculateTagStats(questions);
    }, [questions]);

    // Step 2: Enhance tag tree with computed metrics (pure function, memoized)
    const enhancedTags = useMemo(() => {
        const rootTags = SUBJECT_TAGS_MAP[subjectKey];

        // If subjectKey not found or is 'all', combine all subjects
        const nodesToProcess = Array.isArray(rootTags)
            ? rootTags
            : Object.values(SUBJECT_TAGS_MAP).flat();

        return enhanceTagTree(nodesToProcess, statsMap);
    }, [statsMap, subjectKey]);

    // Step 3: Flatten for easy rendering (pure function, memoized)
    const flatEnhancedTags = useMemo(() => {
        return flattenEnhancedTags(enhancedTags);
    }, [enhancedTags]);

    return { enhancedTags, flatEnhancedTags };
}
