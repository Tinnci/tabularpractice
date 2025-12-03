import { useProgressStore } from "@/lib/store";
import { usePaperGroups, useQuestions } from "@/hooks/useQuestions";
import { useMemo } from "react";
import { SUBJECT_CONFIG, getSubjectKey } from "@/lib/subjectConfig";

// 定义统计结构
export type SubjectStat = {
    id: string;      // 比如 'math', 'english', 'major-408'
    name: string;    // 显示名称，比如 '数学', '英语', '数据结构'
    total: number;
    mastered: number;
    confused: number;
    failed: number;
    unanswered: number;
};

export function useDashboardStats() {
    const progress = useProgressStore(state => state.progress);
    const { paperGroups } = usePaperGroups();
    const { questionsIndex } = useQuestions();

    return useMemo(() => {
        // 1. 初始化动态的统计容器
        const statsMap: Record<string, SubjectStat> = {};
        const totalStat = { mastered: 0, confused: 0, failed: 0, unanswered: 0, total: 0 };

        // 预处理 PaperGroups，确定有哪些“科目”
        (paperGroups || []).forEach(group => {
            const subjectKey = getSubjectKey(group.id);
            const config = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG['other'];

            // 初始化 Map
            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0
                };
            }
        });

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

            // 如果 map 里没有(比如刚初始化的专业课)，补上
            if (!statsMap[subjectKey]) {
                statsMap[subjectKey] = {
                    id: subjectKey,
                    name: config.label,
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0
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

        return { total: totalStat, subjects: Object.values(statsMap) };
    }, [progress, questionsIndex, paperGroups]);
}

