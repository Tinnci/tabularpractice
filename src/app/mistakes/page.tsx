"use client";

import { useState } from 'react';
import { useMistakes } from '@/hooks/useMistakes';
import { MistakeReviewCard } from "@/components/business/Mistakes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, AlertCircle, CheckCircle2, BrainCircuit, XCircle, HelpCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { DICT } from "@/lib/i18n";

export default function MistakesPage() {
    const router = useRouter();
    const { mistakes, stats, isLoading } = useMistakes();
    const [reviewMode, setReviewMode] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const handleStartReview = () => {
        if (mistakes.length > 0) {
            setReviewMode(true);
            setCurrentQuestionIndex(0);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < mistakes.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Finished all questions
            setReviewMode(false);
            // Optionally show a summary or celebration
        }
    };

    const handleExitReview = () => {
        setReviewMode(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (reviewMode) {
        const currentQuestion = mistakes[currentQuestionIndex];
        return (
            <div className="h-screen flex flex-col bg-background">
                <header className="border-b p-4 flex items-center justify-between bg-card">
                    <Button variant="ghost" onClick={handleExitReview} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {DICT.mistakes.exit}
                    </Button>
                    <div className="text-sm font-medium text-muted-foreground">
                        {DICT.mistakes.progress
                            .replace("{current}", String(currentQuestionIndex + 1))
                            .replace("{total}", String(mistakes.length))}
                    </div>
                </header>
                <main className="flex-1 overflow-hidden p-4 md:p-6 max-w-4xl mx-auto w-full">
                    {currentQuestion ? (
                        <MistakeReviewCard
                            key={currentQuestion.id}
                            question={currentQuestion}
                            onNext={handleNextQuestion}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <h2 className="text-2xl font-bold">{DICT.mistakes.allCaughtUp}</h2>
                            <p className="text-muted-foreground">{DICT.mistakes.allCaughtUpDesc}</p>
                            <Button onClick={handleExitReview}>{DICT.mistakes.backToDashboard}</Button>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{DICT.mistakes.title}</h1>
                    <p className="text-muted-foreground">{DICT.mistakes.desc}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{DICT.mistakes.total}</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">{DICT.mistakes.toReview}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{DICT.mistakes.failedCount}</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
                        <p className="text-xs text-muted-foreground">{DICT.mistakes.failedDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{DICT.mistakes.confusedCount}</CardTitle>
                        <HelpCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.confused}</div>
                        <p className="text-xs text-muted-foreground">{DICT.mistakes.confusedDesc}</p>
                    </CardContent>
                </Card>
            </div>

            {mistakes.length > 0 ? (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                        <div className="p-4 bg-background rounded-full shadow-sm">
                            <BrainCircuit className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">{DICT.mistakes.readyTitle}</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {DICT.mistakes.readyDesc}
                            </p>
                        </div>
                        <Button size="lg" className="px-8 text-lg h-12 shadow-lg hover:shadow-xl transition-all" onClick={handleStartReview}>
                            <Play className="mr-2 w-5 h-5" />
                            {DICT.mistakes.startReview}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                        <CheckCircle2 className="w-16 h-16 text-muted-foreground/50" />
                        <h2 className="text-xl font-semibold text-muted-foreground">{DICT.mistakes.noMistakes}</h2>
                        <p className="text-sm text-muted-foreground">{DICT.mistakes.noMistakesDesc}</p>
                    </CardContent>
                </Card>
            )}

            {/* Optional: List view of mistakes could go here if requested, but the immersive mode is the priority */}
        </div>
    );
}
