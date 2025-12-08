import { useProgressStore } from "@/lib/store";
import { usePaperGroups, useQuestions } from "@/hooks/useQuestions";
import { useMemo } from "react";
import { SUBJECT_CONFIG, getSubjectKey } from "@/lib/subjectConfig";
import { useLearningStats, formatDuration } from "@/hooks/useLearningStats";

// 定义统计结构
export type SubjectStat = {
    id: string;      // 比如 'math', 'english', 'major-408'
    name: string;    // 显示名称，比如 '数学', '英语', '数据结构'
    total: number;
    mastered: number;
    confused: number;
    failed: number;
    unanswered: number;
    timeMs?: number;  // 新增：该科目累计用时
};

export function useDashboardStats() {
    const progress = useProgressStore(state => state.progress);
    const times = useProgressStore(state => state.times);
    const { paperGroups } = usePaperGroups();
    const { questionsIndex } = useQuestions();

    // 引入学习统计
    const learningStats = useLearningStats({ days: 7 });

    return useMemo(() => {
        // 1. 初始化动态的统计容器
        const statsMap: Record<string, SubjectStat> = {};
        const totalStat = { mastered: 0, confused: 0, failed: 0, unanswered: 0, total: 0 };

        // 预处理 PaperGroups，确定有哪些"科目"
        (paperGroups || []).forEach(group => {
            const subjectKey = getSubjectKey(group.id);
            const config = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG['other'];

            // 初始化 Map
            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0,
                    timeMs: 0
                };
            }
        });

        // 创建 questionId -> subjectKey 的映射，用于统计时间
        const questionSubjectMap: Record<string, string> = {};

        // 2. 遍历所有题目进行统计
        questionsIndex.forEach(q => {
            const status = progress[q.id];

            // 更新总数
            totalStat.total++;
            if (status === 'mastered') totalStat.mastered++;
            else if (status === 'confused') totalStat.confused++;
            else if (status === 'failed') totalStat.failed++;
            else totalStat.unanswered++;

            // 确定科目
            // 优先使用 paperId 来判断科目，因为它通常包含科目信息 (e.g. math1-2023)
            const subjectKey = getSubjectKey(q.paperId) || getSubjectKey(q.id);
            const config = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG['other'];

            // 记录映射关系
            questionSubjectMap[q.id] = subjectKey;

            // 如果 map 里没有(比如刚初始化的专业课)，补上
            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0,
                    timeMs: 0
                };
            }

            // 更新分科统计
            const s = statsMap[subjectKey];
            s.total++;
            if (status === 'mastered') s.mastered++;
            else if (status === 'confused') s.confused++;
            else if (status === 'failed') s.failed++;
            else s.unanswered++;
        });

        // 3. 统计各科目用时
        Object.entries(times).forEach(([questionId, timeMs]) => {
            const subjectKey = questionSubjectMap[questionId];
            if (subjectKey && statsMap[subjectKey]) {
                statsMap[subjectKey].timeMs = (statsMap[subjectKey].timeMs || 0) + timeMs;
            }
        });

        // 4. 计算总用时
        const totalTimeMs = Object.values(times).reduce((sum, t) => sum + t, 0);

        return {
            total: totalStat,
            subjects: Object.values(statsMap),
            // 新增：时间相关统计
            totalTimeMs,
            totalTimeFormatted: formatDuration(totalTimeMs),
            // 来自 useLearningStats 的详细统计
            todayStats: {
                timeMs: learningStats.todayTimeMs,
                timeFormatted: learningStats.todayTimeFormatted,
                questionsCount: learningStats.todayQuestionsCount,
                completedCount: learningStats.todayCompletedCount,
            },
            weeklyStats: {
                dailyData: learningStats.dailyStats,
                totalTimeMs: learningStats.periodTimeMs,
                avgDailyTimeMs: learningStats.avgDailyTimeMs,
                avgTimePerQuestion: learningStats.avgTimePerQuestion,
            },
            streak: learningStats.currentStreak,
            weekOverWeekChange: learningStats.weekOverWeekChange,
        };
    }, [progress, times, questionsIndex, paperGroups, learningStats]);
}
