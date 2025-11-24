"use client"

import { VerticalExamWall } from "@/components/business/VerticalExamWall";
import { Sidebar } from "@/components/business/Sidebar";
import { QuestionModal } from "@/components/business/QuestionModal";
import paperGroupsData from "@/data/paperGroups.json";
import papersData from "@/data/papers.json";
import questionsData from "@/data/questions.json";
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
  const { progress, updateStatus, selectedTagId, currentGroupId, setCurrentGroupId, filterStatus, setFilterStatus } = useProgressStore();

  const [mergedQuestions, setMergedQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 合并进度状态到题目
  useEffect(() => {
    const newQuestions = (questionsData as Question[]).map(q => ({
      ...q,
      status: progress[q.id] || 'unanswered'
    }));
    setMergedQuestions(newQuestions);
  }, [progress]);

  // 根据 currentGroupId 筛选出对应的 Papers (年份)
  const currentPapers = useMemo(() => {
    return (papersData as Paper[]).filter(p => p.groupId === currentGroupId);
  }, [currentGroupId]);

  // 根据 currentPapers 和 selectedTagId 和 filterStatus 筛选出对应的 Questions
  const filteredQuestions = useMemo(() => {
    const currentPaperIds = currentPapers.map(p => p.id);
    let filtered = mergedQuestions.filter(q => currentPaperIds.includes(q.paperId));

    // 知识点筛选
    if (selectedTagId) {
      filtered = filtered.filter(q => q.tags.includes(selectedTagId));
    }

    // 新增：状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => (q.status || 'unanswered') === filterStatus);
    }

    return filtered;
  }, [mergedQuestions, currentPapers, selectedTagId, filterStatus]);

  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  // 计算当前题目在筛选结果中的索引（上下文感知）
  const currentIndex = useMemo(() => {
    if (!selectedQuestionId) return -1;
    return filteredQuestions.findIndex(q => q.id === selectedQuestionId);
  }, [selectedQuestionId, filteredQuestions]);

  const currentQuestion = filteredQuestions[currentIndex] || null;

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
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* 顶部工具栏：切换试卷组 */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">真题墙</h2>

            {/* 试卷组选择器 */}
            <Select value={currentGroupId} onValueChange={setCurrentGroupId}>
              <SelectTrigger className="w-[280px]">
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

            {/* 状态筛选器 */}
            <div className="flex items-center gap-2 border-l pl-4">
              <ListFilter className="w-4 h-4 text-slate-400" />
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
                <ToggleGroupItem value="mastered" aria-label="熟练" className="text-xs text-green-600">
                  熟练
                </ToggleGroupItem>
                <ToggleGroupItem value="confused" aria-label="不熟" className="text-xs text-yellow-600">
                  不熟
                </ToggleGroupItem>
                <ToggleGroupItem value="failed" aria-label="不会" className="text-xs text-red-600">
                  不会
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="text-sm font-mono text-slate-400">
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
