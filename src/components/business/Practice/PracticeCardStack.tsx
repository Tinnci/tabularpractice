"use client";

import { useState, useCallback } from "react";
import { Question, Status, ViewType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { QuestionDetailView } from "@/components/question";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, Timer, Pause, Play,
    Eye, FileText, MonitorPlay, PenLine, Pencil, Check, HelpCircle, X
} from "lucide-react";
import { DICT, formatQuestionNumber } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { getBilibiliEmbed } from "@/lib/utils";

export interface PracticeCardStackProps {
    queue: Question[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onUpdateStatus: (id: string, status: Status) => void;
    onEndSession: () => void;
    // Timer
    formattedTime: string;
    isTimerRunning: boolean;
    toggleTimer: () => void;
}

export function PracticeCardStack({
    queue,
    currentIndex,
    onNext,
    onPrev,
    onUpdateStatus,
    onEndSession,
    formattedTime,
    isTimerRunning,
    toggleTimer
}: PracticeCardStackProps) {
    const [visibleViews, setVisibleViews] = useState<Set<ViewType>>(new Set(['question']));

    const toggleView = useCallback((view: ViewType) => {
        setVisibleViews(prev => {
            const newSet = new Set(prev);
            if (newSet.has(view)) newSet.delete(view);
            else newSet.add(view);
            return newSet;
        });
    }, []);

    const currentQuestion = queue[currentIndex];
    const nextQuestion = queue[currentIndex + 1];
    const deepNextQuestion = queue[currentIndex + 2];

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < queue.length - 1;

    const hasVideo = currentQuestion?.videoUrl ? !!getBilibiliEmbed(currentQuestion.videoUrl) : false;

    const handleStatusUpdate = useCallback((status: Status) => {
        if (!currentQuestion?.id) return;
        onUpdateStatus(currentQuestion.id, status);
    }, [currentQuestion, onUpdateStatus]);

    // Calculate card styles based on position
    const getCardStyle = (offset: number) => {
        if (offset === 0) {
            // Active card
            return {
                transform: 'translateZ(0) scale(1)',
                opacity: 1,
                filter: 'blur(0px)',
                zIndex: 30,
            };
        } else if (offset === 1) {
            // Next card
            return {
                transform: 'translateZ(-60px) translateY(20px) scale(0.92)',
                opacity: 0.5,
                filter: 'blur(3px)',
                zIndex: 20,
            };
        } else if (offset === 2) {
            // Deep next card
            return {
                transform: 'translateZ(-120px) translateY(40px) scale(0.84)',
                opacity: 0.25,
                filter: 'blur(6px)',
                zIndex: 10,
            };
        }
        return { display: 'none' };
    };

    if (!currentQuestion) return null;

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
            {/* HUD: Top Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-b bg-background/80 backdrop-blur-md flex items-center justify-between z-40 shadow-sm">
                {/* Left: Question Info & Timer */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                            {formatQuestionNumber(currentQuestion.number)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {currentIndex + 1} / {queue.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                        <Timer className={cn("w-4 h-4", isTimerRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
                        <span className="font-mono font-bold text-lg min-w-[60px]">{formattedTime}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={toggleTimer}>
                            {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>

                {/* Center: View Toggles */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                    {hasVideo && (
                        <Toggle size="sm" pressed={visibleViews.has('video')} onPressedChange={() => toggleView('video')} className="h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                            <MonitorPlay className="h-4 w-4" />
                        </Toggle>
                    )}
                    <Toggle size="sm" pressed={visibleViews.has('answer')} onPressedChange={() => toggleView('answer')} className="h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                        <Eye className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" pressed={visibleViews.has('analysis')} onPressedChange={() => toggleView('analysis')} className="h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                        <FileText className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" pressed={visibleViews.has('note')} onPressedChange={() => toggleView('note')} className="h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                        <PenLine className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" pressed={visibleViews.has('draft')} onPressedChange={() => toggleView('draft')} className="h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                        <Pencil className="h-4 w-4" />
                    </Toggle>
                </div>

                {/* Right: End Session */}
                <Button variant="outline" size="sm" onClick={onEndSession} className="gap-2">
                    <X className="w-4 h-4" /> {DICT.practice.endSession}
                </Button>
            </div>

            {/* Stage: 3D Card Stack */}
            <div
                className="flex-1 relative overflow-hidden"
                style={{ perspective: '1200px' }}
            >
                {/* Background Cards (Next, DeepNext) */}
                {deepNextQuestion && (
                    <div
                        key={`deep-${deepNextQuestion.id}`}
                        className="absolute inset-4 sm:inset-8 rounded-2xl bg-card border shadow-xl overflow-hidden transition-all duration-500 ease-out pointer-events-none"
                        style={getCardStyle(2)}
                    >
                        <div className="h-full flex items-center justify-center text-muted-foreground/50">
                            <Badge variant="outline" className="text-sm">{formatQuestionNumber(deepNextQuestion.number)}</Badge>
                        </div>
                    </div>
                )}
                {nextQuestion && (
                    <div
                        key={`next-${nextQuestion.id}`}
                        className="absolute inset-4 sm:inset-8 rounded-2xl bg-card border shadow-xl overflow-hidden transition-all duration-500 ease-out pointer-events-none"
                        style={getCardStyle(1)}
                    >
                        <div className="h-full flex items-center justify-center text-muted-foreground/50">
                            <Badge variant="outline" className="text-sm">{formatQuestionNumber(nextQuestion.number)}</Badge>
                        </div>
                    </div>
                )}

                {/* Active Card */}
                <div
                    key={currentQuestion.id}
                    className="absolute inset-4 sm:inset-8 rounded-2xl bg-card border shadow-2xl overflow-hidden transition-all duration-500 ease-out"
                    style={getCardStyle(0)}
                >
                    <QuestionDetailView
                        question={currentQuestion}
                        visibleViews={visibleViews}
                        maxWidth="max-w-5xl"
                    />
                </div>
            </div>

            {/* HUD: Bottom Bar (Navigation & Status) */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-t bg-background/80 backdrop-blur-md flex items-center justify-between z-40">
                {/* Navigation: Prev */}
                <Button variant="outline" size="lg" disabled={!hasPrev} onClick={onPrev} className="gap-2 w-28">
                    <ChevronLeft className="w-5 h-5" /> {DICT.common.prev}
                </Button>

                {/* Status Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStatusUpdate('mastered')}
                        className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                    >
                        <Check className="w-4 h-4" /> {DICT.status.mastered}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStatusUpdate('confused')}
                        className="gap-2 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                    >
                        <HelpCircle className="w-4 h-4" /> {DICT.status.confused}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleStatusUpdate('failed')}
                        className="gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    >
                        <X className="w-4 h-4" /> {DICT.status.failed}
                    </Button>
                </div>

                {/* Navigation: Next */}
                <Button variant="default" size="lg" disabled={!hasNext} onClick={onNext} className="gap-2 w-28">
                    {DICT.common.next} <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
