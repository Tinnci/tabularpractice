"use client"

import { ExamWall } from "@/components/business/ExamWall";
import questionsData from "@/data/questions.json"; // 原始静态数据
import { Question, Status } from "@/lib/types";
import { useState, useEffect } from "react";
import { useProgressStore } from "@/lib/store";
import { QuestionModal } from "@/components/business/QuestionModal";

export default function Home() {
  // 1. 从 Store 获取进度和更新方法
  const { progress, updateStatus } = useProgressStore();

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
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">真题墙</h1>
        <div className="flex items-center justify-between">
          <p className="text-slate-500">2023年考研数学一真题概览</p>
          {/* 这里以后可以放统计组件 */}
          <div className="text-sm font-mono text-slate-400">
            已刷: {Object.keys(progress).length} / {questionsData.length}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white mx-4">
        <div className="p-6">
          <ExamWall questions={mergedQuestions} onQuestionClick={handleQuestionClick} />
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
