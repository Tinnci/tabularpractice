"use client"

import { ExamWall } from "@/components/business/ExamWall";
import { Sidebar } from "@/components/business/Sidebar"; // 新增
import { QuestionModal } from "@/components/business/QuestionModal";
import questionsData from "@/data/questions.json"; // 原始静态数据
import { Question, Status } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { useProgressStore } from "@/lib/store";

export default function Home() {
  // 1. 从 Store 获取进度和更新方法
  const { progress, updateStatus, selectedTagId } = useProgressStore(); // 获取 selectedTagId

  // 2. 本地状态：合并了进度的题目列表
  const [mergedQuestions, setMergedQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 3. 合并逻辑：当原始数据或进度变化时，重新计算题目列表
  useEffect(() => {
    const newQuestions = (questionsData as Question[]).map(q => ({
      ...q,
      // 如果 Store 里有状态就用 Store 的，否则用默认的 'unanswered'
      status: progress[q.id] || 'unanswered'
    }));
    setMergedQuestions(newQuestions);
  }, [progress]);

  // 核心过滤逻辑：使用 useMemo 优化性能
  const filteredQuestions = useMemo(() => {
    if (!selectedTagId) return mergedQuestions;
    return mergedQuestions.filter(q => q.tags.includes(selectedTagId));
  }, [mergedQuestions, selectedTagId]);

  // 处理打开模态框
  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  // 处理状态更新（模态框内点击按钮）
  const handleStatusUpdate = (id: string, status: Status) => {
    updateStatus(id, status); // 更新 Store -> 触发 useEffect -> 更新 UI
    setSelectedQuestionId(null); // 关闭模态框
  };

  // 获取当前选中的题目对象
  const currentQuestion = mergedQuestions.find(q => q.id === selectedQuestionId) || null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]"> {/* Flex 容器 */}

      {/* 左侧：侧边栏 */}
      <Sidebar />

      {/* 右侧：主内容区 */}
      <div className="flex-1 bg-slate-50/50">
        <div className="container mx-auto py-6 space-y-8 max-w-5xl">
          <div className="flex flex-col space-y-2 px-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">真题墙</h1>
            <div className="flex items-center justify-between">
              <p className="text-slate-500">
                {/* 动态显示当前筛选状态 */}
                {selectedTagId ? `正在查看：${selectedTagId}` : "2023年考研数学一真题概览"}
              </p>
              {/* 这里以后可以放统计组件 */}
              <div className="text-sm font-mono text-slate-400">
                {/* 显示当前视图下的数量 */}
                显示: {filteredQuestions.length} 题
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white mx-4 min-h-[500px]">
            <div className="p-6">
              {/* 传入过滤后的题目列表 */}
              {filteredQuestions.length > 0 ? (
                <ExamWall questions={filteredQuestions} onQuestionClick={handleQuestionClick} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 py-20">
                  <p>该知识点下暂无题目</p>
                  <p className="text-xs mt-2">请确保 data/questions.json 中的 tags 字段包含对应 ID</p>
                </div>
              )}
            </div>
          </div>
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
