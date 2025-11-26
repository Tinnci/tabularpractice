import { useMemo } from "react";
import { useProgressStore } from "@/lib/store";
import { useQuestions, usePaperGroups } from "@/hooks/useQuestions";
import { derivePapersFromQuestions } from "@/lib/utils";
import localPaperGroupsData from "@/data/paperGroups.json";
import { PaperGroup } from "@/lib/types";

export function useContextQuestions() {
    const {
        progress,
        currentGroupId,
        filterType,
        filterYear,
    } = useProgressStore();

    const { questionsIndex } = useQuestions();
    const { paperGroups: remotePaperGroups } = usePaperGroups();

    // 优先使用远程加载的试卷组，如果加载中或失败则使用本地数据作为回退
    const paperGroupsData = (remotePaperGroups || localPaperGroupsData) as PaperGroup[];

    // 动态生成 papers 列表
    const allPapers = useMemo(() => {
        return derivePapersFromQuestions(questionsIndex, paperGroupsData);
    }, [questionsIndex, paperGroupsData]);

    // 合并进度状态到题目
    const mergedQuestions = useMemo(() => {
        return questionsIndex.map(q => ({
            ...q,
            status: progress[q.id] || 'unanswered'
        }));
    }, [questionsIndex, progress]);

    // 根据 currentGroupId 筛选出对应的 Papers (年份)
    const currentPapers = useMemo(() => {
        return allPapers.filter(p => p.groupId === currentGroupId);
    }, [currentGroupId, allPapers]);

    // 1. 第一层：上下文筛选 (用于统计，不包含状态筛选)
    const contextQuestions = useMemo(() => {
        const currentPaperIds = currentPapers.map(p => p.id);
        let filtered = mergedQuestions.filter(q => currentPaperIds.includes(q.paperId));

        // 题型筛选
        if (filterType !== 'all') {
            filtered = filtered.filter(q => {
                if (filterType === 'choice') return q.type === 'choice';
                if (filterType === 'fill') return q.type === 'fill';
                if (filterType === 'answer') return q.type === 'answer';
                return true;
            });
        }

        // 年份筛选
        if (filterYear !== 'all') {
            const targetYear = parseInt(filterYear);
            const targetPaperIds = currentPapers.filter(p => p.year === targetYear).map(p => p.id);
            filtered = filtered.filter(q => targetPaperIds.includes(q.paperId));
        }

        return filtered;
    }, [mergedQuestions, currentPapers, filterType, filterYear]);

    return {
        contextQuestions,
        currentPapers,
        mergedQuestions,
        paperGroupsData
    };
}
