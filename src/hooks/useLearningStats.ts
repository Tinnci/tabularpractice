import { useMemo } from 'react';
import { useProgressStore } from '@/lib/store';
import { DailyStudyStats } from '@/lib/types';
import { DICT } from '@/lib/i18n';

/**
 * 格式化时间为人类可读的字符串
 */
export function formatDuration(ms: number, options?: {
    showSeconds?: boolean;
    compact?: boolean;
}): string {
    const { showSeconds = false, compact = false } = options || {};

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (compact) {
        if (hours > 0) return `${hours}h${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}${DICT.common.hours}`);
    if (minutes > 0) parts.push(`${minutes}${DICT.common.minutes}`);
    if (showSeconds && seconds > 0) parts.push(`${seconds}${DICT.common.seconds}`);

    // 默认情况：如果完全没有有效部分，至少显示"0分钟"
    if (parts.length === 0) {
        return showSeconds ? `${seconds}${DICT.common.seconds}` : DICT.common.lessThanMinute;
    }

    return parts.join('');
}

/**
 * 获取最近 N 天的日期范围
 */
function getRecentDateRange(days: number): [string, string] {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);

    const format = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return [format(start), format(end)];
}

/**
 * 获取今日日期字符串
 */
function getTodayDateString(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface LearningStatsOptions {
    /**
     * 统计的天数范围（向前追溯）
     * @default 7
     */
    days?: number;
}

export interface LearningStats {
    // === 总体统计 ===
    /** 累计总学习时长（毫秒）- 来自 times 字段 */
    totalTimeMs: number;
    /** 格式化的总学习时长 */
    totalTimeFormatted: string;

    // === 今日统计 ===
    /** 今日学习时长（毫秒） */
    todayTimeMs: number;
    /** 格式化的今日学习时长 */
    todayTimeFormatted: string;
    /** 今日做题数 */
    todayQuestionsCount: number;
    /** 今日完成数（标记了状态） */
    todayCompletedCount: number;

    // === 周期统计 ===
    /** 指定天数内的每日统计 */
    dailyStats: DailyStudyStats[];
    /** 指定天数内的总学习时长 */
    periodTimeMs: number;
    /** 指定天数内的总做题数 */
    periodQuestionsCount: number;
    /** 平均每天学习时长 */
    avgDailyTimeMs: number;
    /** 平均每题用时 */
    avgTimePerQuestion: number;

    // === 趋势数据（用于图表） ===
    /** 连续学习天数（Streak） */
    currentStreak: number;
    /** 本周与上周对比（正数为增长） */
    weekOverWeekChange: number;
}

/**
 * 统一的学习统计 Hook
 * 
 * @example
 * const { todayTimeFormatted, dailyStats, currentStreak } = useLearningStats({ days: 7 });
 */
export function useLearningStats(options: LearningStatsOptions = {}): LearningStats {
    const { days = 7 } = options;

    const times = useProgressStore(state => state.times);
    const getTodayStats = useProgressStore(state => state.getTodayStats);
    const getDailyStats = useProgressStore(state => state.getDailyStats);
    const studyRecords = useProgressStore(state => state.studyRecords);

    return useMemo(() => {
        // === 总体统计 ===
        const totalTimeMs = Object.values(times).reduce((sum, t) => sum + t, 0);

        // === 今日统计 ===
        const todayStats = getTodayStats();
        const todayTimeMs = todayStats.totalDurationMs;
        const todayQuestionsCount = todayStats.questionsAttempted;
        const todayCompletedCount = todayStats.questionsCompleted;

        // === 周期统计 ===
        const dateRange = getRecentDateRange(days);
        const dailyStats = getDailyStats(dateRange);

        const periodTimeMs = dailyStats.reduce((sum, d) => sum + d.totalDurationMs, 0);
        const periodQuestionsCount = dailyStats.reduce((sum, d) => sum + d.questionsAttempted, 0);
        const avgDailyTimeMs = dailyStats.length > 0 ? periodTimeMs / dailyStats.length : 0;
        const avgTimePerQuestion = periodQuestionsCount > 0 ? periodTimeMs / periodQuestionsCount : 0;

        // === 连续学习天数计算 ===
        let currentStreak = 0;
        const today = getTodayDateString();
        const statsMap = new Map(dailyStats.map(s => [s.date, s]));

        // 从今天开始向前数
        const checkDate = new Date();
        for (let i = 0; i < 365; i++) {  // 最多检查一年
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            const stats = statsMap.get(dateStr);

            if (stats && stats.questionsAttempted > 0) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateStr === today) {
                // 今天还没做题，不算断，继续检查昨天
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // === 周对比计算 ===
        const thisWeekRange = getRecentDateRange(7);
        const lastWeekRange: [string, string] = (() => {
            const end = new Date();
            end.setDate(end.getDate() - 7);
            const start = new Date(end);
            start.setDate(start.getDate() - 6);
            const format = (d: Date) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return [format(start), format(end)];
        })();

        const thisWeekStats = getDailyStats(thisWeekRange);
        const lastWeekStats = getDailyStats(lastWeekRange);
        const thisWeekTime = thisWeekStats.reduce((sum, d) => sum + d.totalDurationMs, 0);
        const lastWeekTime = lastWeekStats.reduce((sum, d) => sum + d.totalDurationMs, 0);
        const weekOverWeekChange = lastWeekTime > 0
            ? ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100
            : (thisWeekTime > 0 ? 100 : 0);

        return {
            totalTimeMs,
            totalTimeFormatted: formatDuration(totalTimeMs),

            todayTimeMs,
            todayTimeFormatted: formatDuration(todayTimeMs),
            todayQuestionsCount,
            todayCompletedCount,

            dailyStats,
            periodTimeMs,
            periodQuestionsCount,
            avgDailyTimeMs,
            avgTimePerQuestion,

            currentStreak,
            weekOverWeekChange,
        };
    }, [times, studyRecords, days, getTodayStats, getDailyStats]);
}

/**
 * 获取单个题目的学习统计
 */
export function useQuestionLearningStats(questionId: string) {
    const getQuestionStats = useProgressStore(state => state.getQuestionStats);
    const times = useProgressStore(state => state.times);

    return useMemo(() => {
        const stats = getQuestionStats(questionId);
        const legacyTime = times[questionId] || 0;

        return {
            ...stats,
            // 如果有旧的 times 数据但没有 studyRecords，使用 times 作为 fallback
            totalTimeMs: stats.totalTimeMs || legacyTime,
            formattedTime: formatDuration(stats.totalTimeMs || legacyTime),
            formattedAvgTime: formatDuration(stats.avgTimeMs, { showSeconds: true }),
        };
    }, [questionId, getQuestionStats, times]);
}
