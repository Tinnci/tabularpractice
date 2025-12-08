import { StateCreator } from 'zustand';
import { StudyRecord, DailyStudyStats } from '@/lib/types';
import { StoreState } from '../types';

// 生成唯一 ID 的简单实现（避免额外依赖）
const generateId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

// 获取今日日期字符串
const getTodayDateString = (): string => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 从时间戳获取日期字符串
const getDateFromTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface AnalyticsSlice {
    // 状态
    studyRecords: StudyRecord[];
    dailyStatsCache: Record<string, DailyStudyStats>;  // 缓存，key 为日期
    analyticsMetadata: {
        lastCleanup: number;               // 上次清理时间戳
        recordsVersion: number;            // 数据版本（用于迁移）
    };

    // 动作
    addStudyRecord: (record: Omit<StudyRecord, 'id'>) => void;
    getStudyRecords: (options?: {
        questionId?: string;
        dateRange?: [string, string];  // [startDate, endDate] YYYY-MM-DD
        limit?: number;
    }) => StudyRecord[];
    getDailyStats: (dateRange?: [string, string]) => DailyStudyStats[];
    getTodayStats: () => DailyStudyStats;
    getQuestionStats: (questionId: string) => {
        totalTimeMs: number;
        attemptCount: number;
        avgTimeMs: number;
        lastAttemptAt: number | null;
    };
    cleanupOldRecords: (olderThanDays?: number) => void;
    invalidateDailyStatsCache: () => void;
}

// 默认清理阈值：90 天
const DEFAULT_CLEANUP_DAYS = 90;
// 最大记录数量限制（防止存储爆炸）
const MAX_RECORDS_COUNT = 10000;

export const createAnalyticsSlice: StateCreator<StoreState, [], [], AnalyticsSlice> = (set, get) => ({
    studyRecords: [],
    dailyStatsCache: {},
    analyticsMetadata: {
        lastCleanup: 0,
        recordsVersion: 1,
    },

    addStudyRecord: (recordData) => {
        const record: StudyRecord = {
            ...recordData,
            id: generateId(),
        };

        set((state) => {
            const newRecords = [...state.studyRecords, record];

            // 自动触发清理（如果记录数超过阈值）
            const needsCleanup = newRecords.length > MAX_RECORDS_COUNT;

            // 失效相关日期的缓存
            const recordDate = getDateFromTimestamp(record.startedAt);
            const newCache = { ...state.dailyStatsCache };
            delete newCache[recordDate];

            return {
                studyRecords: needsCleanup
                    ? newRecords.slice(-MAX_RECORDS_COUNT * 0.8)  // 保留 80%
                    : newRecords,
                dailyStatsCache: newCache,
            };
        });
    },

    getStudyRecords: (options = {}) => {
        const { questionId, dateRange, limit } = options;
        let records = get().studyRecords;

        // 按 questionId 过滤
        if (questionId) {
            records = records.filter(r => r.questionId === questionId);
        }

        // 按日期范围过滤
        if (dateRange) {
            const [startDate, endDate] = dateRange;
            const startTs = new Date(startDate).getTime();
            const endTs = new Date(endDate).setHours(23, 59, 59, 999);
            records = records.filter(r => r.startedAt >= startTs && r.startedAt <= endTs);
        }

        // 按时间倒序排列（最新的在前）
        records = [...records].sort((a, b) => b.startedAt - a.startedAt);

        // 限制数量
        if (limit && limit > 0) {
            records = records.slice(0, limit);
        }

        return records;
    },

    getDailyStats: (dateRange) => {
        const records = get().studyRecords;
        const cache = get().dailyStatsCache;

        // 按日期分组统计
        const statsMap: Record<string, DailyStudyStats> = {};

        records.forEach(record => {
            const date = getDateFromTimestamp(record.startedAt);

            // 如果有日期范围限制，检查是否在范围内
            if (dateRange) {
                if (date < dateRange[0] || date > dateRange[1]) return;
            }

            // 优先使用缓存（但今天的数据不使用缓存，因为可能还在变化）
            const today = getTodayDateString();
            if (date !== today && cache[date]) {
                statsMap[date] = cache[date];
                return;
            }

            // 初始化或更新统计
            if (!statsMap[date]) {
                statsMap[date] = {
                    date,
                    questionsAttempted: 0,
                    questionsCompleted: 0,
                    totalDurationMs: 0,
                    mastered: 0,
                    confused: 0,
                    failed: 0,
                };
            }

            const stats = statsMap[date];
            stats.questionsAttempted++;
            stats.totalDurationMs += record.durationMs;

            if (record.status) {
                stats.questionsCompleted++;
                if (record.status === 'mastered') stats.mastered++;
                if (record.status === 'confused') stats.confused++;
                if (record.status === 'failed') stats.failed++;
            }
        });

        // 更新缓存（排除今天）
        const today = getTodayDateString();
        const newCache = { ...cache };
        Object.entries(statsMap).forEach(([date, stats]) => {
            if (date !== today) {
                newCache[date] = stats;
            }
        });
        // 异步更新缓存，不阻塞返回
        setTimeout(() => set({ dailyStatsCache: newCache }), 0);

        // 返回按日期排序的数组
        return Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));
    },

    getTodayStats: () => {
        const today = getTodayDateString();
        const stats = get().getDailyStats([today, today]);
        return stats[0] || {
            date: today,
            questionsAttempted: 0,
            questionsCompleted: 0,
            totalDurationMs: 0,
            mastered: 0,
            confused: 0,
            failed: 0,
        };
    },

    getQuestionStats: (questionId) => {
        const records = get().studyRecords.filter(r => r.questionId === questionId);
        const totalTimeMs = records.reduce((sum, r) => sum + r.durationMs, 0);
        const attemptCount = records.length;

        return {
            totalTimeMs,
            attemptCount,
            avgTimeMs: attemptCount > 0 ? Math.round(totalTimeMs / attemptCount) : 0,
            lastAttemptAt: records.length > 0
                ? Math.max(...records.map(r => r.startedAt))
                : null,
        };
    },

    cleanupOldRecords: (olderThanDays = DEFAULT_CLEANUP_DAYS) => {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        set((state) => ({
            studyRecords: state.studyRecords.filter(r => r.startedAt >= cutoffTime),
            analyticsMetadata: {
                ...state.analyticsMetadata,
                lastCleanup: Date.now(),
            },
            dailyStatsCache: {},  // 清理后失效所有缓存
        }));
    },

    invalidateDailyStatsCache: () => {
        set({ dailyStatsCache: {} });
    },
});
