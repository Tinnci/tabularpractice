/**
 * Tests for domain/statistics.ts
 */

import { describe, test, expect } from 'bun:test';
import {
    calculateTagStats,
    calculateWeaknessScore,
    calculatePriority,
    calculateSizeMultiplier,
    deduplicateQuestions,
    deduplicatePaperGroups,
    filterQuestions,
    type TagStats
} from '@/lib/domain/statistics';
import { Question } from '@/lib/types';

describe('calculateTagStats', () => {
    test('should calculate statistics correctly', () => {
        const questions: Question[] = [
            { id: '1', paperId: 'p1', number: 1, type: 'choice', tags: ['tag1'], status: 'mastered' } as Question & { status: string },
            { id: '2', paperId: 'p1', number: 2, type: 'choice', tags: ['tag1'], status: 'confused' } as Question & { status: string },
            { id: '3', paperId: 'p1', number: 3, type: 'choice', tags: ['tag2'], status: 'failed' } as Question & { status: string },
        ];

        const stats = calculateTagStats(questions);

        expect(stats.get('tag1')).toEqual({
            total: 2,
            mastered: 1,
            confused: 1,
            failed: 0,
            unanswered: 0
        });

        expect(stats.get('tag2')).toEqual({
            total: 1,
            mastered: 0,
            confused: 0,
            failed: 1,
            unanswered: 0
        });
    });

    test('should handle questions without tags', () => {
        const questions: Question[] = [
            { id: '1', paperId: 'p1', number: 1, type: 'choice', tags: [] }
        ];

        const stats = calculateTagStats(questions);
        expect(stats.size).toBe(0);
    });
});

describe('calculateWeaknessScore', () => {
    test('should return 1.0 when all questions are failed', () => {
        const stats: TagStats = { total: 3, mastered: 0, confused: 0, failed: 3, unanswered: 0 };
        expect(calculateWeaknessScore(stats)).toBe(1.0);
    });

    test('should return 0.5 when all questions are confused', () => {
        const stats: TagStats = { total: 2, mastered: 0, confused: 2, failed: 0, unanswered: 0 };
        expect(calculateWeaknessScore(stats)).toBe(0.5);
    });

    test('should return 0.0 when all questions are mastered', () => {
        const stats: TagStats = { total: 5, mastered: 5, confused: 0, failed: 0, unanswered: 0 };
        expect(calculateWeaknessScore(stats)).toBe(0.0);
    });

    test('should return 0.0 when no questions are answered', () => {
        const stats: TagStats = { total: 3, mastered: 0, confused: 0, failed: 0, unanswered: 3 };
        expect(calculateWeaknessScore(stats)).toBe(0.0);
    });
});

describe('calculatePriority', () => {
    test('should return critical for high weakness scores', () => {
        expect(calculatePriority(0.8)).toBe('critical');
    });

    test('should return high for moderate-high weakness scores', () => {
        expect(calculatePriority(0.5)).toBe('high');
    });

    test('should return medium for moderate-low weakness scores', () => {
        expect(calculatePriority(0.2)).toBe('medium');
    });

    test('should return low for low weakness scores', () => {
        expect(calculatePriority(0.05)).toBe('low');
    });
});

describe('calculateSizeMultiplier', () => {
    test('should return min 1 for small totals', () => {
        expect(calculateSizeMultiplier(0)).toBeGreaterThanOrEqual(1);
        expect(calculateSizeMultiplier(1)).toBeGreaterThanOrEqual(1);
    });

    test('should return max 3 for large totals', () => {
        expect(calculateSizeMultiplier(100)).toBeLessThanOrEqual(3);
        expect(calculateSizeMultiplier(1000)).toBeLessThanOrEqual(3);
    });

    test('should grow logarithmically', () => {
        const size4 = calculateSizeMultiplier(4);
        const size8 = calculateSizeMultiplier(8);
        expect(size8).toBeGreaterThan(size4);
    });
});

describe('deduplicateQuestions', () => {
    test('should keep first occurrence when duplicates exist', () => {
        const questions: Question[] = [
            { id: '1', paperId: 'p1', number: 1, type: 'choice', tags: [] },
            { id: '2', paperId: 'p1', number: 2, type: 'choice', tags: [] },
            { id: '1', paperId: 'p2', number: 3, type: 'choice', tags: [] }, // Duplicate
        ];

        const result = deduplicateQuestions(questions);
        expect(result).toHaveLength(2);
        expect(result[0].paperId).toBe('p1'); // First occurrence kept
    });

    test('should return all questions when no duplicates', () => {
        const questions: Question[] = [
            { id: '1', paperId: 'p1', number: 1, type: 'choice', tags: [] },
            { id: '2', paperId: 'p1', number: 2, type: 'choice', tags: [] },
        ];

        const result = deduplicateQuestions(questions);
        expect(result).toHaveLength(2);
    });
});

describe('deduplicatePaperGroups', () => {
    test('should deduplicate groups by id', () => {
        const groups = [
            { id: 'g1', name: 'Group 1' },
            { id: 'g2', name: 'Group 2' },
            { id: 'g1', name: 'Group 1 Duplicate' },
        ];

        const result = deduplicatePaperGroups(groups);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Group 1'); // First occurrence kept
    });
});

describe('filterQuestions', () => {
    const questions: Question[] = [
        { id: '1', paperId: 'math1-2023', number: 1, type: 'choice', tags: [] },
        { id: '2', paperId: 'math1-2024', number: 2, type: 'choice', tags: [] },
        { id: '3', paperId: 'english1-2023', number: 3, type: 'choice', tags: [] },
    ];

    test('should filter by hidden paper IDs', () => {
        const result = filterQuestions(questions, ['math1-2023']);
        expect(result).toHaveLength(2);
        expect(result.find(q => q.paperId === 'math1-2023')).toBeUndefined();
    });

    test('should filter by hidden group IDs (prefix match)', () => {
        const result = filterQuestions(questions, [], ['math1']);
        expect(result).toHaveLength(1);
        expect(result[0].paperId).toBe('english1-2023');
    });

    test('should apply both filters', () => {
        const result = filterQuestions(questions, ['math1-2024'], ['english1']);
        expect(result).toHaveLength(1);
        expect(result[0].paperId).toBe('math1-2023');
    });

    test('should return all questions when no filters applied', () => {
        const result = filterQuestions(questions);
        expect(result).toHaveLength(3);
    });
});
