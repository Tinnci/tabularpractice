import { useProgressStore } from "@/lib/store";
import { usePaperGroups, useQuestions } from "@/hooks/useQuestions";
import { usePapers } from "@/hooks/usePapers";
import { useMemo } from "react";
import { getSubjectKey, getSubjectConfig } from "@/lib/subjectConfig";
import { useLearningStats, formatDuration } from "@/hooks/useLearningStats";
import { PaperGroup, Paper } from "@/lib/types";

// 定义统计结构
export type SubjectStat = {
    id: string;           // 比如 'math', 'english', 'major'
    name: string;         // 显示名称，比如 '数学', '英语', '专业课'
    total: number;
    mastered: number;
    confused: number;
    failed: number;
    unanswered: number;
    timeMs?: number;      // 该科目累计用时
    isUnified?: boolean;  // 是否统考（用于 UI 差异化）
};

// 统考 vs 自命题的汇总统计
export type ExamTypeStat = {
    unified: {
        total: number;
        completed: number;
        timeMs: number;
    };
    selfProposed: {
        total: number;
        completed: number;
        timeMs: number;
    };
};

export function useDashboardStats() {
    const progress = useProgressStore(state => state.progress);
    const times = useProgressStore(state => state.times);
    const { paperGroups } = usePaperGroups();
    const { questionsIndex } = useQuestions();
    const { papers } = usePapers();

    // 引入学习统计
    const learningStats = useLearningStats({ days: 7 });

    return useMemo(() => {
        // 1. 构建 PaperGroup 映射表（用于查询 subjectKey 和 type）
        const groupMap = new Map<string, PaperGroup>();
        (paperGroups || []).forEach(group => {
            groupMap.set(group.id, group);
        });

        // 1.1 构建 Paper 映射表 (用于查询 paper.subjectKey)
        const paperMap = new Map<string, Paper>();
        (papers || []).forEach(p => {
            paperMap.set(p.id, p);
        });

        // 2. 初始化统计容器
        const statsMap: Record<string, SubjectStat> = {};
        const totalStat = { mastered: 0, confused: 0, failed: 0, unanswered: 0, total: 0 };
        const examTypeStat: ExamTypeStat = {
            unified: { total: 0, completed: 0, timeMs: 0 },
            selfProposed: { total: 0, completed: 0, timeMs: 0 }
        };

        // 预处理 PaperGroups，确定有哪些"科目"
        (paperGroups || []).forEach(group => {
            // 优先使用 group.subjectKey，否则推断
            const subjectKey = group.subjectKey || getSubjectKey(group.id);
            const config = getSubjectConfig(subjectKey);

            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0,
                    timeMs: 0,
                    isUnified: group.type === 'unified'
                };
            }
        });

        // 创建 questionId -> { subjectKey, examType } 的映射
        const questionMetaMap: Record<string, { subjectKey: string; examType: 'unified' | 'self_proposed' }> = {};

        // 3. 遍历所有题目进行统计
        questionsIndex.forEach(q => {
            const status = progress[q.id];

            // 更新总数
            totalStat.total++;
            if (status === 'mastered') totalStat.mastered++;
            else if (status === 'confused') totalStat.confused++;
            else if (status === 'failed') totalStat.failed++;
            else totalStat.unanswered++;

            // 从 paperId 解析出 groupId（格式通常是 "groupId-year"）
            const groupIdGuess = q.paperId.replace(/-\d{4}$/, '');
            const group = groupMap.get(groupIdGuess) || groupMap.get(q.paperId);
            const paper = paperMap.get(q.paperId);

            // 确定科目（优先级：Paper.subjectKey > Group.subjectKey > Infer from ID）
            const subjectKey = paper?.subjectKey || group?.subjectKey || getSubjectKey(q.paperId);
            const examType = group?.type || 'unified';
            const config = getSubjectConfig(subjectKey);

            // 记录映射关系
            questionMetaMap[q.id] = { subjectKey, examType };

            // 更新统考/自命题统计
            if (examType === 'unified') {
                examTypeStat.unified.total++;
                if (status && status !== 'unanswered') {
                    examTypeStat.unified.completed++;
                }
            } else {
                examTypeStat.selfProposed.total++;
                if (status && status !== 'unanswered') {
                    examTypeStat.selfProposed.completed++;
                }
            }

            // 如果 map 里没有该科目，补上
            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0,
                    timeMs: 0,
                    isUnified: examType === 'unified'
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

        // 4. 统计各科目用时
        Object.entries(times).forEach(([questionId, timeMs]) => {
            const meta = questionMetaMap[questionId];
            if (meta) {
                if (statsMap[meta.subjectKey]) {
                    statsMap[meta.subjectKey].timeMs = (statsMap[meta.subjectKey].timeMs || 0) + timeMs;
                }
                // 更新统考/自命题用时
                if (meta.examType === 'unified') {
                    examTypeStat.unified.timeMs += timeMs;
                } else {
                    examTypeStat.selfProposed.timeMs += timeMs;
                }
            }
        });

        // 5. 计算总用时
        const totalTimeMs = Object.values(times).reduce((sum, t) => sum + t, 0);

        return {
            total: totalStat,
            subjects: Object.values(statsMap),
            // 新增：统考 vs 自命题统计
            examTypeStat,
            // 时间相关统计
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
    }, [progress, times, questionsIndex, paperGroups, papers, learningStats]);
}
