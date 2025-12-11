import { describe, it, expect } from 'bun:test';
import {
    cn,
    getBilibiliEmbed,
    getBilibiliTimestamp,
    formatTimestamp,
    getImageUrl,
} from '../utils';

describe('utils', () => {
    describe('cn (className merger)', () => {
        it('should merge class names correctly', () => {
            expect(cn('foo', 'bar')).toBe('foo bar');
        });

        it('should handle conditional classes', () => {
            expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
        });

        it('should deduplicate Tailwind classes', () => {
            // twMerge should handle conflicting utilities
            const result = cn('px-4', 'px-2');
            expect(result).toBe('px-2'); // Later wins
        });
    });

    describe('getBilibiliEmbed', () => {
        it('should extract BVID from standard URL', () => {
            const url = 'https://www.bilibili.com/video/BV1xx411c7mD';
            const result = getBilibiliEmbed(url);

            expect(result).toContain('bvid=BV1xx411c7mD');
            expect(result).toContain('player.bilibili.com');
        });

        it('should extract BVID and page parameter', () => {
            const url = 'https://www.bilibili.com/video/BV1xx411c7mD?p=2';
            const result = getBilibiliEmbed(url);

            expect(result).toContain('bvid=BV1xx411c7mD');
            expect(result).toContain('page=2');
        });

        it('should extract timestamp parameter', () => {
            const url = 'https://www.bilibili.com/video/BV1xx411c7mD?t=120';
            const result = getBilibiliEmbed(url);

            expect(result).toContain('t=120');
        });

        it('should return null for invalid URL', () => {
            const result = getBilibiliEmbed('not-a-url');
            expect(result).toBeNull();
        });

        it('should return null if BVID is missing', () => {
            const url = 'https://www.bilibili.com/video/';
            const result = getBilibiliEmbed(url);
            expect(result).toBeNull();
        });
    });

    describe('getBilibiliTimestamp', () => {
        it('should extract timestamp from t parameter', () => {
            const url = 'https://www.bilibili.com/video/BV1xx?t=120';
            expect(getBilibiliTimestamp(url)).toBe(120);
        });

        it('should extract timestamp from time parameter', () => {
            const url = 'https://www.bilibili.com/video/BV1xx?time=60';
            expect(getBilibiliTimestamp(url)).toBe(60);
        });

        it('should return null if no timestamp', () => {
            const url = 'https://www.bilibili.com/video/BV1xx';
            expect(getBilibiliTimestamp(url)).toBeNull();
        });

        it('should return null for invalid timestamp', () => {
            const url = 'https://www.bilibili.com/video/BV1xx?t=abc';
            expect(getBilibiliTimestamp(url)).toBeNull();
        });
    });

    describe('formatTimestamp', () => {
        it('should format seconds to MM:SS', () => {
            expect(formatTimestamp(65)).toBe('1:05');
        });

        it('should format seconds to HH:MM:SS', () => {
            expect(formatTimestamp(3665)).toBe('1:01:05');
        });

        it('should handle zero seconds', () => {
            expect(formatTimestamp(0)).toBe('0:00');
        });

        it('should pad single digit seconds', () => {
            expect(formatTimestamp(5)).toBe('0:05');
        });
    });

    describe('getImageUrl', () => {
        it('should return absolute HTTP URLs unchanged', () => {
            const url = 'https://example.com/image.png';
            expect(getImageUrl(url)).toBe(url);
        });

        it('should return data URLs unchanged', () => {
            const url = 'data:image/png;base64,iVBORw0K...';
            expect(getImageUrl(url)).toBe(url);
        });

        it('should use question.sourceUrl if provided', () => {
            const url = 'images/q1.png';
            const question = {
                id: 'q1',
                paperId: 'p1',
                number: 1,
                type: 'choice' as const,
                tags: [],
                sourceUrl: 'https://repo.com/data'
            };

            expect(getImageUrl(url, question)).toBe('https://repo.com/data/images/q1.png');
        });

        it('should use repoBaseUrl if question.sourceUrl is missing', () => {
            const url = 'images/q1.png';
            const repoBaseUrl = 'https://base.com/data';

            expect(getImageUrl(url, null, repoBaseUrl)).toBe('https://base.com/data/images/q1.png');
        });

        it('should use repoSources as fallback', () => {
            const url = 'images/q1.png';
            const repoSources = [
                { id: 'default-remote', name: 'Remote', url: 'https://source.com/data', enabled: true }
            ];

            expect(getImageUrl(url, null, undefined, repoSources)).toBe('https://source.com/data/images/q1.png');
        });

        it('should return undefined for undefined input', () => {
            expect(getImageUrl(undefined)).toBeUndefined();
        });

        it('should handle URLs with leading slash', () => {
            const url = '/images/q1.png';
            const question = {
                id: 'q1',
                paperId: 'p1',
                number: 1,
                type: 'choice' as const,
                tags: [],
                sourceUrl: 'https://repo.com/data'
            };

            expect(getImageUrl(url, question)).toBe('https://repo.com/data/images/q1.png');
        });
    });
});
