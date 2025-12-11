import { describe, it, expect } from 'bun:test';
import { syncService, SyncData } from '../syncService';
import { Status } from '@/lib/types';

describe('syncService', () => {
    describe('mergeData', () => {
        const baseData: SyncData = {
            version: 3,
            timestamp: new Date().toISOString(),
            progress: {},
            progressLastModified: {},
            notes: {},
            notesLastModified: {},
            times: {},
            timesLastModified: {},
            stars: {},
            repoSources: [],
            history: {},
        };

        it('should keep local data if it is newer', () => {
            const local: SyncData = {
                ...baseData,
                progress: { 'q1': 'mastered' },
                progressLastModified: { 'q1': 2000 },
            };
            const remote: SyncData = {
                ...baseData,
                progress: { 'q1': 'failed' },
                progressLastModified: { 'q1': 1000 }, // Older
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.progress['q1']).toBe('mastered');
            expect(merged.progressLastModified!['q1']).toBe(2000);
        });

        it('should take remote data if it is newer', () => {
            const local: SyncData = {
                ...baseData,
                progress: { 'q1': 'mastered' },
                progressLastModified: { 'q1': 1000 },
            };
            const remote: SyncData = {
                ...baseData,
                progress: { 'q1': 'failed' },
                progressLastModified: { 'q1': 2000 }, // Newer
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.progress['q1']).toBe('failed');
            expect(merged.progressLastModified!['q1']).toBe(2000);
        });

        it('should use Max Strategy for timing data (prevent data loss)', () => {
            const local: SyncData = {
                ...baseData,
                times: { 'q1': 5000 }, // 5s
                timesLastModified: { 'q1': 1000 }
            };
            const remote: SyncData = {
                ...baseData,
                times: { 'q1': 8000 }, // 8s (Remote has more time accumulated)
                timesLastModified: { 'q1': 900 } // Even if modified earlier (maybe synced from another device)
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.times!['q1']).toBe(8000);
        });

        it('should use Max Strategy for timing data (local bigger)', () => {
            const local: SyncData = {
                ...baseData,
                times: { 'q1': 9000 }, // 9s
                timesLastModified: { 'q1': 2000 }
            };
            const remote: SyncData = {
                ...baseData,
                times: { 'q1': 8000 },
                timesLastModified: { 'q1': 1000 }
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.times!['q1']).toBe(9000);
        });

        it('should union and deduplicate repoSources', () => {
            const local: SyncData = {
                ...baseData,
                repoSources: [
                    { id: '1', name: 'Repo A', url: 'http://a.com', enabled: true }
                ]
            };
            const remote: SyncData = {
                ...baseData,
                repoSources: [
                    { id: '1', name: 'Repo A', url: 'http://a.com', enabled: true }, // Duplicate
                    { id: '2', name: 'Repo B', url: 'http://b.com', enabled: true } // New
                ]
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.repoSources).toHaveLength(2);
            expect(merged.repoSources.find(r => r.name === 'Repo B')).toBeDefined();
        });

        it('should merge notes based on timestamp', () => {
            const local: SyncData = {
                ...baseData,
                notes: { 'q1': 'local note' },
                notesLastModified: { 'q1': 1000 }
            };
            const remote: SyncData = {
                ...baseData,
                notes: { 'q1': 'remote note' },
                notesLastModified: { 'q1': 2000 } // Newer
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.notes['q1']).toBe('remote note');
        });

        it('should merge history using Max Strategy', () => {
            const local: SyncData = {
                ...baseData,
                history: { '2023-01-01': 5 }
            };
            const remote: SyncData = {
                ...baseData,
                history: {
                    '2023-01-01': 3, // Smaller, should use local
                    '2023-01-02': 10 // New, should include
                }
            };

            const merged = syncService.mergeData(local, remote);
            expect(merged.history!['2023-01-01']).toBe(5);
            expect(merged.history!['2023-01-02']).toBe(10);
        });
    });
});
