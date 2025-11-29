"use client"

import { VerticalExamWall } from "@/components/business/VerticalExamWall";
import { Sidebar } from "@/components/business/Sidebar";
import { QuestionModal } from "@/components/business/QuestionModal";
import { GlobalSearch } from "@/components/business/GlobalSearch";
import { Button } from "@/components/ui/button";
import { usePaperDetail } from "@/hooks/useQuestions";
import { Question, Status, PaperGroup } from "@/lib/types";
import { useState, useEffect, useMemo, Suspense } from "react";
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
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ShortcutsHelpModal } from "@/components/business/ShortcutsHelpModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSearchParams } from "next/navigation";
import { useContextQuestions } from "@/hooks/useContextQuestions";

function QuestionsContent() {
  const {
    progress, updateStatus,
    selectedTagId,
    currentGroupId,
    setCurrentGroupId,
    filterStatus,
    filterType,
    filterYear,
    filterStarred,
    stars,
    setFilterStatus,
    setFilterType,
    setFilterYear,
    lowDataMode,
    repoBaseUrl
  } = useProgressStore();

  const { contextQuestions, currentPapers, mergedQuestions, paperGroupsData } = useContextQuestions();

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // URL 参数同步逻辑
  const searchParams = useSearchParams();
  useEffect(() => {
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');

    if (status) {
      setFilterStatus(status as Status);
    }

    if (subject) {
      const targetGroup = paperGroupsData.find(g => g.id.startsWith(subject));
      if (targetGroup) {
        if (useProgressStore.getState().currentGroupId !== targetGroup.id) {
          setCurrentGroupId(targetGroup.id);
        }
      }
    }
  }, [searchParams, setFilterStatus, setCurrentGroupId, paperGroupsData]);

  // 获取当前试卷组包含的所有年份
  const availableYears = useMemo(() => {
    const years = currentPapers.map(p => p.year);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [currentPapers]);

  // 快捷键逻辑
  const handleYearSwitch = (direction: 'prev' | 'next') => {
    if (availableYears.length === 0) return;

    const currentYearInt = filterYear === 'all' ? null : parseInt(filterYear);
    let newYear: string | 'all' = 'all';

    if (currentYearInt === null) {
      if (direction === 'prev') newYear = availableYears[0].toString();
      else newYear = availableYears[availableYears.length - 1].toString();
    } else {
      const currentIndex = availableYears.indexOf(currentYearInt);
      if (currentIndex === -1) return;
      const newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;

      if (newIndex < 0) {
        newYear = 'all';
      } else if (newIndex >= availableYears.length) {
        newYear = availableYears[availableYears.length - 1].toString();
      } else {
        newYear = availableYears[newIndex].toString();
      }
    }
    setFilterYear(newYear);
  };

  useKeyboardShortcuts([
    { key: '?', shiftKey: true, action: () => setShowShortcutsHelp(true) },
    { key: '[', action: () => handleYearSwitch('prev') },
    { key: ']', action: () => handleYearSwitch('next') }
  ]);

  // 2. 第二层：视图筛选 (用于列表展示，包含状态筛选)
  const filteredQuestions = useMemo(() => {
    let filtered = contextQuestions;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => (q.status || 'unanswered') === filterStatus);
    }

    if (filterStarred) {
      filtered = filtered.filter(q => stars[q.id]);
    }

    return filtered;
  }, [contextQuestions, filterStatus, filterStarred, stars]);

  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  const currentIndex = useMemo(() => {
    if (!selectedQuestionId) return -1;
    return filteredQuestions.findIndex(q => q.id === selectedQuestionId);
  }, [selectedQuestionId, filteredQuestions]);

  const selectedQuestionMeta = filteredQuestions[currentIndex] || null;

  const { paperDetail, isLoading: isPaperLoading } = usePaperDetail(selectedQuestionMeta?.paperId || null);

  const currentQuestion = useMemo(() => {
    if (!selectedQuestionMeta) return null;
    const detail = paperDetail?.questions?.[selectedQuestionMeta.id] || {};
    return { ...selectedQuestionMeta, ...detail } as Question;
  }, [selectedQuestionMeta, paperDetail]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (currentIndex === -1) return;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredQuestions.length) {
      setSelectedQuestionId(filteredQuestions[newIndex].id);
    }
  };

  const handleStatusUpdate = (id: string, status: Status) => {
    updateStatus(id, status);

    // 仅在"斩"（mastered）时自动跳转下一题
    // "懵"和"崩"通常需要查看解析或做笔记，所以停留在当前题
    if (status === 'mastered') {
      const hasNext = currentIndex < filteredQuestions.length - 1 && currentIndex !== -1;
      if (hasNext) {
        handleNavigate('next');
      } else {
        setSelectedQuestionId(null);
      }
    }
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredQuestions.length - 1 && currentIndex !== -1;

  const groupedPaperGroups = useMemo(() => {
    const unified = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'unified');
    const selfProposed = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'self_proposed');
    return { unified, selfProposed };
  }, [paperGroupsData]);

  useEffect(() => {
    if (currentIndex === -1 || currentIndex >= filteredQuestions.length - 1) return;
    const nextQuestion = filteredQuestions[currentIndex + 1];
    if (!nextQuestion) return;

    const preloadImage = (url?: string, sourceUrl?: string) => {
      if (lowDataMode) return;
      if (!url) return;
      let finalUrl = url;
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        const base = sourceUrl || repoBaseUrl;
        if (base) {
          const cleanBase = base.replace(/\/$/, '');
          const cleanPath = url.startsWith('/') ? url : `/${url}`;
          finalUrl = `${cleanBase}${cleanPath}`;
        }
      }
      const img = new Image();
      img.src = finalUrl;
    };

    preloadImage(nextQuestion.contentImg || nextQuestion.imageUrl, nextQuestion.sourceUrl);
    preloadImage(nextQuestion.answerImg, nextQuestion.sourceUrl);
    preloadImage(nextQuestion.analysisImg, nextQuestion.sourceUrl);
  }, [currentIndex, filteredQuestions, lowDataMode, repoBaseUrl]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <Sidebar questions={contextQuestions} />
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <div className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-y-3 gap-x-4 bg-background z-20 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap hidden sm:block">真题墙</h2>
            <Select value={currentGroupId} onValueChange={setCurrentGroupId}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-9 border-dashed sm:border-solid">
                <SelectValue placeholder="选择试卷组" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>统考科目</SelectLabel>
                  {groupedPaperGroups.unified.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectGroup>
                {groupedPaperGroups.selfProposed.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>自命题科目</SelectLabel>
                    {groupedPaperGroups.selfProposed.map(group => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1 justify-start sm:justify-center order-3 sm:order-2 w-full sm:w-auto">
            <div className="flex items-center bg-muted/50 p-1 rounded-lg shrink-0">
              <ToggleGroup type="single" value={filterStatus} onValueChange={(v) => setFilterStatus((v as Status | 'all') || 'all')} className="gap-0">
                <ToggleGroupItem value="all" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-accent dark:data-[state=on]:text-accent-foreground">全部</ToggleGroupItem>
                <ToggleGroupItem value="unanswered" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-accent dark:data-[state=on]:text-accent-foreground">未做</ToggleGroupItem>
                <div className="w-px h-4 bg-border mx-1" />
                <ToggleGroupItem value="mastered" className="h-7 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900 dark:data-[state=on]:text-green-300">斩</ToggleGroupItem>
                <ToggleGroupItem value="confused" className="h-7 px-2 text-xs data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 dark:data-[state=on]:bg-yellow-900 dark:data-[state=on]:text-yellow-300">懵</ToggleGroupItem>
                <ToggleGroupItem value="failed" className="h-7 px-2 text-xs data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900 dark:data-[state=on]:text-red-300">崩</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-none hover:bg-muted/50">
                          <span>{filterYear === 'all' ? '年份' : filterYear}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部年份</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>快捷键: [ 上一年 / ] 下一年</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Select value={filterType} onValueChange={(val) => setFilterType(val as 'all' | 'choice' | 'fill' | 'answer')}>
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

          <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowShortcutsHelp(true)}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>快捷键帮助 (?)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <GlobalSearch questions={mergedQuestions} onQuestionSelect={(id) => setSelectedQuestionId(id)} />

            <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground border-l pl-3 leading-tight">
              <span>{filteredQuestions.length} 题</span>
              <span>/ {Object.keys(progress).length} 已刷</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <VerticalExamWall papers={currentPapers} questions={filteredQuestions} onQuestionClick={handleQuestionClick} highlightTagId={selectedTagId} />
        </div>
      </div>

      <QuestionModal
        isOpen={!!selectedQuestionId}
        onClose={() => setSelectedQuestionId(null)}
        question={currentQuestion}
        onUpdateStatus={handleStatusUpdate}
        onPrev={() => handleNavigate('prev')}
        onNext={() => handleNavigate('next')}
        hasPrev={hasPrev}
        hasNext={hasNext}
        isLoading={isPaperLoading}
      />

      <ShortcutsHelpModal open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
