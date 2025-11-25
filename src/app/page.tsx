"use client"

import { VerticalExamWall } from "@/components/business/VerticalExamWall";
import { Sidebar } from "@/components/business/Sidebar";
import { QuestionModal } from "@/components/business/QuestionModal";
import { GlobalSearch } from "@/components/business/GlobalSearch";
import paperGroupsData from "@/data/paperGroups.json";
import papersData from "@/data/papers.json";
// import questionsData from "@/data/questions.json"; // Removed
import { useQuestions, usePaperDetail } from "@/hooks/useQuestions";
import { Question, Status, Paper, PaperGroup } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { useProgressStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ListFilter } from "lucide-react";

export default function Home() {
  const {
    progress, updateStatus, selectedTagId, currentGroupId, setCurrentGroupId,
    filterStatus, setFilterStatus,
    filterType, setFilterType,
    filterYear, setFilterYear
  } = useProgressStore();

  const { questionsIndex, isLoading } = useQuestions();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 合并进度状态到题目
  const mergedQuestions = useMemo(() => {
    return questionsIndex.map(q => ({
      ...q,
      status: progress[q.id] || 'unanswered'
    }));
  }, [questionsIndex, progress]);

  // 根据 currentGroupId 筛选出对应的 Papers (年份)
  const currentPapers = useMemo(() => {
    return (papersData as Paper[]).filter(p => p.groupId === currentGroupId);
  }, [currentGroupId]);

  // 获取当前试卷组包含的所有年份 (用于筛选下拉框)
  const availableYears = useMemo(() => {
    const years = currentPapers.map(p => p.year);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [currentPapers]);

  // 根据 currentPapers 和 selectedTagId 和 filterStatus 筛选出对应的 Questions
  const filteredQuestions = useMemo(() => {
    const currentPaperIds = currentPapers.map(p => p.id);
    let filtered = mergedQuestions.filter(q => currentPaperIds.includes(q.paperId));

    // 知识点筛选
    if (selectedTagId) {
      filtered = filtered.filter(q => q.tags.includes(selectedTagId));
    }

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => (q.status || 'unanswered') === filterStatus);
    }

    // 题型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    // 年份筛选
    if (filterYear !== 'all') {
      // filterYear is string, q.paperId needs to be checked against papers
      // 或者更简单：找到对应年份的 paperIds
      const targetYear = parseInt(filterYear);
      const targetPaperIds = currentPapers.filter(p => p.year === targetYear).map(p => p.id);
      filtered = filtered.filter(q => targetPaperIds.includes(q.paperId));
    }

    return filtered;
  }, [mergedQuestions, currentPapers, selectedTagId, filterStatus, filterType, filterYear]);

  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  // 计算当前题目在筛选结果中的索引（上下文感知）
  const currentIndex = useMemo(() => {
    if (!selectedQuestionId) return -1;
    return filteredQuestions.findIndex(q => q.id === selectedQuestionId);
  }, [selectedQuestionId, filteredQuestions]);

  // 获取当前题目的元数据
  const selectedQuestionMeta = filteredQuestions[currentIndex] || null;

  // 懒加载详情数据
  const { paperDetail } = usePaperDetail(selectedQuestionMeta?.paperId || null);

  // 合并详情数据
  const currentQuestion = useMemo(() => {
    if (!selectedQuestionMeta) return null;

    // 尝试从 paperDetail 中获取详情，如果还没加载完则使用 meta (可能缺 content)
    const detail = paperDetail?.questions?.[selectedQuestionMeta.id] || {};

    return {
      ...selectedQuestionMeta,
      ...detail
    } as Question;
  }, [selectedQuestionMeta, paperDetail]);

  // 导航处理函数
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    // 边界检查
    if (newIndex >= 0 && newIndex < filteredQuestions.length) {
      setSelectedQuestionId(filteredQuestions[newIndex].id);
    }
  };

  // 状态更新处理（优化：自动跳转下一题）
  const handleStatusUpdate = (id: string, status: Status) => {
    updateStatus(id, status);

    // 自动跳转到下一题，如果是最后一题则关闭
    const hasNext = currentIndex < filteredQuestions.length - 1 && currentIndex !== -1;
    if (hasNext) {
      handleNavigate('next');
    } else {
      setSelectedQuestionId(null);
    }
  };

  // 计算导航按钮状态
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredQuestions.length - 1 && currentIndex !== -1;

  // 将试卷组按类型分组
  const groupedPaperGroups = useMemo(() => {
    const unified = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'unified');
    const selfProposed = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'self_proposed');
    return { unified, selfProposed };
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">

      {/* 左侧：侧边栏 */}
      <Sidebar />

      {/* 右侧：主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        {/* 顶部工具栏：切换试卷组 */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-background z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">真题墙</h2>

            {/* 全局搜索 */}
            <GlobalSearch
              questions={mergedQuestions}
              onQuestionSelect={(id) => setSelectedQuestionId(id)}
            />

            {/* 试卷组选择器 */}
            <Select value={currentGroupId} onValueChange={setCurrentGroupId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择试卷组" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>统考科目</SelectLabel>
                  {groupedPaperGroups.unified.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                {groupedPaperGroups.selfProposed.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>自命题科目</SelectLabel>
                    {groupedPaperGroups.selfProposed.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>

            {/* 年份筛选 */}
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="年份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年份</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 题型筛选 */}
            <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="题型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部题型</SelectItem>
                <SelectItem value="choice">选择题</SelectItem>
                <SelectItem value="fill">填空题</SelectItem>
                <SelectItem value="answer">解答题</SelectItem>
              </SelectContent>
            </Select>

            {/* 状态筛选器 */}
            <div className="flex items-center gap-2 border-l pl-4">
              <ListFilter className="w-4 h-4 text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={filterStatus}
                onValueChange={(value) => setFilterStatus((value as Status | 'all') || 'all')}
                className="gap-1"
              >
                <ToggleGroupItem value="all" aria-label="全部" className="text-xs">
                  全部
                </ToggleGroupItem>
                <ToggleGroupItem value="unanswered" aria-label="未做" className="text-xs">
                  未做
                </ToggleGroupItem>
                <ToggleGroupItem value="mastered" aria-label="熟练" className="text-xs text-green-600 dark:text-green-400">
                  熟练
                </ToggleGroupItem>
                <ToggleGroupItem value="confused" aria-label="不熟" className="text-xs text-yellow-600 dark:text-yellow-400">
                  不熟
                </ToggleGroupItem>
                <ToggleGroupItem value="failed" aria-label="不会" className="text-xs text-red-600 dark:text-red-400">
                  不会
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="text-sm font-mono text-muted-foreground">
            显示: {filteredQuestions.length} 题 | 已刷: {Object.keys(progress).length} 题
          </div>
        </div>

        {/* 真题墙区域 - 高度自适应 */}
        <div className="flex-1 overflow-hidden p-4">
          <VerticalExamWall
            papers={currentPapers}
            questions={filteredQuestions}
            onQuestionClick={handleQuestionClick}
          />
        </div>
      </div>

      {/* 模态框集成 */}
      <QuestionModal
        isOpen={!!selectedQuestionId}
        onClose={() => setSelectedQuestionId(null)}
        question={currentQuestion}
        onUpdateStatus={handleStatusUpdate}
        onPrev={() => handleNavigate('prev')}
        onNext={() => handleNavigate('next')}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}
