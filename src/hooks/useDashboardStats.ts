import { useProgressStore } from "@/lib/store";
import { usePaperGroups, useQuestions } from "@/hooks/useQuestions";
import { useMemo } from "react";

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

// 科目名称映射表 (可扩展)
const SUBJECT_DISPLAY_MAP: Record<string, string> = {
    math: "数学",
    english: "英语",
    politics: "政治",
    cs: "计算机统考",
    art: "艺术概论",
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
            let subjectId = group.id; // 默认用 group id 作为科目 id
            let subjectName = group.name;

            // 归类逻辑：合并 math1, math2 -> math
            if (group.id.startsWith('math')) { subjectId = 'math'; subjectName = '数学'; }
            else if (group.id.startsWith('english')) { subjectId = 'english'; subjectName = '英语'; }
            else if (group.id.startsWith('politics')) { subjectId = 'politics'; subjectName = '政治'; }
            // 其他保持原样，或尝试从 ID 提取前缀
            else {
                const match = group.id.match(/^([a-z]+)/);
                if (match) {
                    // 尝试使用映射表优化名称
                    if (SUBJECT_DISPLAY_MAP[match[1]]) {
                        subjectId = match[1];
                        subjectName = SUBJECT_DISPLAY_MAP[match[1]];
                    }
                }
            }

            // 初始化 Map
            if (!statsMap[subjectId]) {
                statsMap[subjectId] = {
                    id: subjectId,
                    name: subjectName,
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
            let subjectId = 'other';
            // 基于 ID 前缀的 fallback 逻辑
            if (q.id.startsWith('math') || q.paperId.startsWith('math')) subjectId = 'math';
            else if (q.id.startsWith('english') || q.paperId.startsWith('english')) subjectId = 'english';
            else if (q.id.startsWith('politics') || q.paperId.startsWith('politics')) subjectId = 'politics';
            else {
                // 尝试提取前缀 (e.g. cs-408 -> cs)
                const match = q.paperId.match(/^([a-z]+)/);
                if (match) subjectId = match[1];
            }

            // 如果 map 里没有(比如刚初始化的专业课)，补上
            if (!statsMap[subjectId]) {
                statsMap[subjectId] = {
                    id: subjectId,
                    name: SUBJECT_DISPLAY_MAP[subjectId] || subjectId.toUpperCase(),
                    total: 0, mastered: 0, confused: 0, failed: 0, unanswered: 0
                };
            }

            // 更新分科统计
            const s = statsMap[subjectId];
            s.total++;
            if (status === 'mastered') s.mastered++;
            else if (status === 'confused') s.confused++;
            else if (status === 'failed') s.failed++;
            else s.unanswered++;
        });

        return { total: totalStat, subjects: Object.values(statsMap) };
    }, [progress, questionsIndex, paperGroups]);
}
