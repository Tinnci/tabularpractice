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
        {/* 顶部工具栏：切换试卷组 */}
        <div className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-y-3 gap-x-4 bg-background z-20 shadow-sm">

          {/* 1. 左侧：核心上下文 (标题 + 试卷组) */}
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap hidden sm:block">真题墙</h2>

            {/* 试卷组选择器 - 稍微调窄一点 */}
            <Select value={currentGroupId} onValueChange={setCurrentGroupId}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-9 border-dashed sm:border-solid">
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
          </div>

          {/* 2. 中间：筛选器组 (在小屏幕上允许换行或隐藏) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1 justify-start sm:justify-center order-3 sm:order-2 w-full sm:w-auto">

            {/* 状态筛选器 (高频) - 始终显示 */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg shrink-0">
              <ToggleGroup
                type="single"
                value={filterStatus}
                onValueChange={(v) => setFilterStatus((v as Status | 'all') || 'all')}
                className="gap-0"
              >
                {/* 使用图标+文字的响应式设计，或者仅用文字 */}
                <ToggleGroupItem value="all" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">全部</ToggleGroupItem>
                <ToggleGroupItem value="unanswered" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">未做</ToggleGroupItem>
                <div className="w-px h-4 bg-border mx-1" />
                <ToggleGroupItem value="mastered" className="h-7 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900/30 dark:data-[state=on]:text-green-400">斩</ToggleGroupItem>
                <ToggleGroupItem value="confused" className="h-7 px-2 text-xs data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 dark:data-[state=on]:bg-yellow-900/30 dark:data-[state=on]:text-yellow-400">懵</ToggleGroupItem>
                <ToggleGroupItem value="failed" className="h-7 px-2 text-xs data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900/30 dark:data-[state=on]:text-red-400">崩</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* 年份/题型 (次高频) - 在极窄屏幕可能需要隐藏或放入更多菜单 */}
            <div className="flex items-center gap-2 shrink-0">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-none hover:bg-muted/50">
                  <span>{filterYear === 'all' ? '年份' : filterYear}</span>
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

              <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
                <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-none hover:bg-muted/50">
                  <span>{filterType === 'all' ? '题型' : (filterType === 'choice' ? '选择' : filterType === 'fill' ? '填空' : '解答')}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部题型</SelectItem>
                  <SelectItem value="choice">选择题</SelectItem>
                  <SelectItem value="fill">填空题</SelectItem>
                  <SelectItem value="answer">解答题</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. 右侧：搜索与统计 */}
          <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
            <GlobalSearch
              questions={mergedQuestions}
              onQuestionSelect={(id) => setSelectedQuestionId(id)}
            />

            {/* 统计信息 (大屏显示) */}
            <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground border-l pl-3 leading-tight">
              <span>{filteredQuestions.length} 题</span>
              <span>/ {Object.keys(progress).length} 已刷</span>
            </div>
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
