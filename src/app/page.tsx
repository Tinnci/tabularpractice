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

export default function Home() {
  const { progress, updateStatus, selectedTagId, currentGroupId, setCurrentGroupId } = useProgressStore();

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

  // 根据 currentPapers 和 selectedTagId 筛选出对应的 Questions
  const filteredQuestions = useMemo(() => {
    const currentPaperIds = currentPapers.map(p => p.id);
    let filtered = mergedQuestions.filter(q => currentPaperIds.includes(q.paperId));

    // 如果选中了知识点，进一步筛选
    if (selectedTagId) {
      filtered = filtered.filter(q => q.tags.includes(selectedTagId));
    }

    return filtered;
  }, [mergedQuestions, currentPapers, selectedTagId]);

  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  const handleStatusUpdate = (id: string, status: Status) => {
    updateStatus(id, status);
    setSelectedQuestionId(null);
  };

  const currentQuestion = mergedQuestions.find(q => q.id === selectedQuestionId) || null;

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
      />
    </div>
  );
}
