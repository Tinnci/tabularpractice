/**
 * useTagStats Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { useTagStats } from '../useTagStats';
import { useProgressStore } from '@/lib/store';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { mockQuestion } from '../../../test/utils';

// MOCK: subject-tags
// 由于 useTagStats 直接使用 SUBJECT_TAGS_MAP，我们需要在模块级别 mock 它
mock.module('@/data/subject-tags', () => {
    return {
        normalizeTagId: (id: string) => id,
        SUBJECT_TAGS_MAP: {
            'math': [
                { id: 'func_limit', label: 'Function Limits', children: [] },
                {
                    id: 'parent_tag',
                    label: 'Parent',
                    children: [
                        { id: 'child_tag', label: 'Child', children: [] }
                    ]
                }
            ]
        }
    };
});

describe('useTagStats', () => {
    beforeEach(() => {
        useProgressStore.setState({
            progress: {},
            history: {},
        });
    });

    it('should aggregate stats correctly for a single tag', () => {
        const q1 = mockQuestion('q1', ['func_limit']);
        Object.assign(q1, { status: 'mastered' }); // Inject status

        const { result } = renderHook(() => useTagStats([q1], 'math'));

        const tagNode = result.current.flatEnhancedTags.find(t => t.id === 'func_limit');
        expect(tagNode).toBeDefined();
        if (tagNode) {
            expect(tagNode.stats.total).toBe(1);
            expect(tagNode.stats.mastered).toBe(1);
            expect(tagNode.stats.failed).toBe(0);
        }
    });

    it('should calculate stats for child tags', () => {
        const q1 = mockQuestion('q1', ['child_tag']);
        Object.assign(q1, { status: 'failed' });

        const { result } = renderHook(() => useTagStats([q1], 'math'));

        const childNode = result.current.flatEnhancedTags.find(t => t.id === 'child_tag');

        expect(childNode).toBeDefined();
        if (childNode) {
            expect(childNode.stats.total).toBe(1);
            expect(childNode.stats.failed).toBe(1);
        }
    });

    it('should handle empty questions array', () => {
        const { result } = renderHook(() => useTagStats([], 'math'));

        // Empty questions means all tags have 0 stats
        // But structure tags (with children) should still appear
        const parentNode = result.current.flatEnhancedTags.find(t => t.id === 'parent_tag');

        // Based on line 129: if (node.stats.total > 0 || (node.children && node.children.length > 0))
        // Parent with children should appear even if stats.total = 0
        expect(parentNode).toBeDefined();
        if (parentNode) {
            expect(parentNode.stats.total).toBe(0);
        }
    });

    it('should calculate weakness score correctly', () => {
        const q1 = mockQuestion('q1', ['func_limit']);
        const q2 = mockQuestion('q2', ['func_limit']);
        const q3 = mockQuestion('q3', ['func_limit']);

        Object.assign(q1, { status: 'failed' });    // 2 points
        Object.assign(q2, { status: 'confused' });  // 1 point
        Object.assign(q3, { status: 'mastered' });  // 0 points

        const { result } = renderHook(() => useTagStats([q1, q2, q3], 'math'));

        const tagNode = result.current.flatEnhancedTags.find(t => t.id === 'func_limit');

        if (tagNode) {
            // weaknessScore = (failed * 2 + confused) / (totalAnswered * 2)
            // = (1*2 + 1*1) / (3 * 2) = 3/6 = 0.5
            expect(tagNode.computed.weaknessScore).toBe(0.5);
            expect(tagNode.computed.priority).toBe('high'); // 0.5 > 0.4
        }
    });
});
