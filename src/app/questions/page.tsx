"use client"

import { VerticalExamWall } from "@/components/business/Shared";
import { ExamWall } from "@/components/business/Shared";
import { Sidebar } from "@/components/business/Sidebar";
import { QuestionModal } from "@/components/business/QuestionModal";


import { usePaperDetail } from "@/hooks/useQuestions";
import { Question, Status } from "@/lib/types";
import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useProgressStore } from "@/lib/store";
import { DICT } from "@/lib/i18n";
import { QuestionsHeader } from "@/components/business/Questions/QuestionsHeader";
import { ShortcutsHelpModal } from "@/components/business/Shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useContextQuestions } from "@/hooks/useContextQuestions";

function QuestionsContent() {
  const {
    updateStatus,
    selectedTagId,
    setCurrentGroupId,
    filterStatus,
    filterYear,
    filterStarred,
    stars,
    setFilterStatus,
    setFilterYear,
    lowDataMode,
    repoBaseUrl,
    viewMode,
    setViewMode
  } = useProgressStore();

  const { contextQuestions, currentPapers, paperGroupsData } = useContextQuestions();

  // ---------------------------------------------------------------------------
  // View Switching & Scroll Sync Logic
  // ---------------------------------------------------------------------------
  // We track the last visible question ID before switching views to restore position.
  const [centeredQuestionId, setCenteredQuestionId] = useState<string | null>(null);

  // Before viewMode changes, capture the centered element
  const handleViewModeChange = (newMode: 'wall' | 'grid') => {
    // Find the element in the center of the viewport
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const element = document.elementFromPoint(x, y);

    // Traverse up to find the card with data-question-id
    const card = element?.closest('[data-question-id]');
    const id = card?.getAttribute('data-question-id');

    if (id) {
      setCenteredQuestionId(id);
    }
    setViewMode(newMode);
  };

  // After viewMode changes (and DOM updates), scroll to the captured element
  useEffect(() => {
    if (centeredQuestionId) {
      // Using setTimeout to allow layout thrashing/rendering to settle
      // virtua might need time to render the item if it's virtualized (Grid mode)
      // Standard DOM scroll (Wall mode) is instant but might need wait for mounting.
      setTimeout(() => {
        // Try finding the element
        const element = document.querySelector(`[data-question-id="${centeredQuestionId}"]`);

        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        } else {
          // Fallback for virtualized lists (virtua):
          // If element is not in DOM (because it's not rendered yet), we might need `scrollToIndex`
          // exposed by ExamWall. For now, native scrollIntoView works if item is rendered.
          // If items are truly virtualized and not mounted, this simple ID lookup fails.
          // However, virtua usually renders the approximate range.
          // Ideally we'd pass `initialTopMostItemIndex` to VList or use VListHandle.
        }
        setCenteredQuestionId(null); // Reset
      }, 100);
    }
  }, [viewMode, centeredQuestionId]);
  // ---------------------------------------------------------------------------

  // URL 参数同步逻辑
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive state directly from URL
  const selectedQuestionId = searchParams.get('questionId');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Helper to update URL params
  const updateUrl = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

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
    updateUrl({ questionId: id });
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
      updateUrl({ questionId: filteredQuestions[newIndex].id });
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
        updateUrl({ questionId: null });
      }
    }
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredQuestions.length - 1 && currentIndex !== -1;



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

    preloadImage(nextQuestion.contentImg, nextQuestion.sourceUrl);
    preloadImage(nextQuestion.answerImg, nextQuestion.sourceUrl);
    preloadImage(nextQuestion.analysisImg, nextQuestion.sourceUrl);
  }, [currentIndex, filteredQuestions, lowDataMode, repoBaseUrl]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <Sidebar questions={contextQuestions} />
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <QuestionsHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
          filteredCount={filteredQuestions.length}
          onQuestionSelect={(id) => updateUrl({ questionId: id })}
        />

        <div className="flex-1 overflow-hidden p-4 relative">
          {viewMode === 'wall' ? (
            <VerticalExamWall papers={currentPapers} questions={filteredQuestions} onQuestionClick={handleQuestionClick} highlightTagId={selectedTagId} />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <ExamWall questions={filteredQuestions} onQuestionClick={handleQuestionClick} />
            </div>
          )}
        </div>
      </div>

      <QuestionModal
        isOpen={!!selectedQuestionId}
        onClose={() => updateUrl({ questionId: null })}
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
    <Suspense fallback={<div className="flex items-center justify-center h-screen">{DICT.onboarding.loading}</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
