"use client"

import { ExamWall } from "@/components/business/ExamWall";
import { QuestionModal } from "@/components/business/QuestionModal";
import questionsData from "@/data/questions.json";
import { Question } from "@/lib/types";
import { useState } from "react";

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>(questionsData as Question[]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const handleQuestionClick = (id: string) => {
    setSelectedQuestionId(id);
  };

  const handleCloseModal = () => {
    setSelectedQuestionId(null);
  };

  const handleUpdateStatus = (id: string, status: any) => {
    setQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, status } : q
    ));
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 mb-8 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">真题墙</h1>
        <p className="text-slate-500">
          2023年考研数学一真题概览
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white mx-4">
        <div className="p-6">
          <ExamWall questions={questions} onQuestionClick={handleQuestionClick} />
        </div>
      </div>

      <QuestionModal
        question={selectedQuestion}
        isOpen={!!selectedQuestionId}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
