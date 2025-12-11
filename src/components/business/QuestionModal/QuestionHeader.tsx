"use client";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { QuestionTimer } from "@/components/business/QuestionTimer";
import { SmartTagList } from "./SmartTagList";
import {
    Star, Edit2, Loader2, MonitorPlay, Eye, FileText,
    PenLine, Pencil, Lightbulb, Maximize2, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Question, ViewType, Status } from "@/lib/types";
import { DICT, getQuestionTypeLabel, formatQuestionNumber } from "@/lib/i18n";

interface QuestionHeaderProps {
    question: Question;
    isLoading?: boolean;
    isStarred: boolean;
    isEditing: boolean;
    isFullscreen: boolean;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    questionStatus?: Status | 'unanswered';
    visibleViews: Set<ViewType>;
    videoEmbedUrl: string | null;
    formattedTime: string;
    isRunning: boolean;
    hasHistory: boolean;
    formattedTotalTime: string;
    formattedHistoricalTime: string;
    historicalTime: number;
    onToggleStar: () => void;
    onToggleEdit: () => void;
    onToggleFullscreen: () => void;
    onToggleView: (view: ViewType) => void;
    onTimerToggle: () => void;
    onTimerReset: () => void;
    onSetTime: (totalMs: number) => void;
    onSyncRetry: () => void;
}

export function QuestionHeader({
    question,
    isLoading,
    isStarred,
    isEditing,
    isFullscreen,
    syncStatus,
    questionStatus,
    visibleViews,
    videoEmbedUrl,
    formattedTime,
    isRunning,
    hasHistory,
    formattedTotalTime,
    formattedHistoricalTime,
    historicalTime,
    onToggleStar,
    onToggleEdit,
    onToggleFullscreen,
    onToggleView,
    onTimerToggle,
    onTimerReset,
    onSetTime,
    onSyncRetry,
}: QuestionHeaderProps) {
    return (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-background flex items-center justify-between z-20 shadow-sm shrink-0 gap-2 h-14 sm:h-auto max-w-[100vw] overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden flex-1 min-w-0">
                <div className="flex flex-col shrink-0">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1 sm:gap-2">
                        <span className="sm:hidden">{formatQuestionNumber(question.number, true)}</span>
                        <span className="hidden sm:inline">{formatQuestionNumber(question.number)}</span>
                        <QuestionTimer
                            formattedTime={formattedTime}
                            isRunning={isRunning}
                            toggle={onTimerToggle}
                            reset={onTimerReset}
                            className="ml-2 sm:ml-4"
                            hasHistory={hasHistory}
                            formattedTotalTime={formattedTotalTime}
                            formattedHistoricalTime={formattedHistoricalTime}
                            historicalTimeMs={historicalTime}
                            questionId={question.id}
                            onSetTime={onSetTime}
                        />
                        {/* 收藏按钮 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-yellow-500"
                            onClick={onToggleStar}
                            title={isStarred ? DICT.common.unstar : DICT.common.star}
                            disabled={isLoading}
                        >
                            <Star className={cn("w-4 h-4", isStarred && "fill-yellow-500 text-yellow-500")} />
                        </Button>
                        {/* 编辑按钮 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-5 w-5 text-muted-foreground hover:text-blue-500 transition-colors",
                                isEditing && "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            )}
                            onClick={onToggleEdit}
                            title={isEditing ? DICT.manage.closeEdit : DICT.manage.editQuestion}
                            disabled={isLoading}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        {syncStatus === 'syncing' && (
                            <span title={DICT.common.syncing}>
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            </span>
                        )}
                        {syncStatus === 'error' && (
                            <div
                                className="w-2 h-2 rounded-full bg-red-500 cursor-pointer hover:bg-red-600 transition-colors"
                                title={DICT.common.syncFailedRetry}
                                onClick={onSyncRetry}
                            />
                        )}
                    </span>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{getQuestionTypeLabel(question.type)}</span>
                        {/* 已刷过的题目显示历史状态徽章 */}
                        {questionStatus && questionStatus !== 'unanswered' && (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                questionStatus === 'mastered' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                questionStatus === 'confused' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                questionStatus === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                                {questionStatus === 'mastered' && DICT.status.mastered}
                                {questionStatus === 'confused' && DICT.status.confused}
                                {questionStatus === 'failed' && DICT.status.failed}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg ml-auto sm:ml-0 overflow-x-auto no-scrollbar">
                    {videoEmbedUrl && (
                        <Toggle
                            size="sm"
                            pressed={visibleViews.has('video')}
                            onPressedChange={() => onToggleView('video')}
                            className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                            aria-label="Toggle video"
                        >
                            <MonitorPlay className="h-4 w-4 shrink-0" />
                            <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                                {DICT.exam.video}
                            </span>
                        </Toggle>
                    )}
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('answer')}
                        onPressedChange={() => onToggleView('answer')}
                        className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle answer"
                    >
                        <Eye className="h-4 w-4 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            {DICT.exam.answer}
                        </span>
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('analysis')}
                        onPressedChange={() => onToggleView('analysis')}
                        className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle analysis"
                    >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            {DICT.exam.analysis}
                        </span>
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('note')}
                        onPressedChange={() => onToggleView('note')}
                        className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle note"
                    >
                        <PenLine className="h-4 w-4 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            {DICT.exam.note}
                        </span>
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('draft')}
                        onPressedChange={() => onToggleView('draft')}
                        className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle draft"
                    >
                        <Pencil className="h-4 w-4 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            {DICT.exam.draft}
                        </span>
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('eureka')}
                        onPressedChange={() => onToggleView('eureka')}
                        className="group h-8 px-2.5 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 dark:data-[state=on]:bg-yellow-900/30 dark:data-[state=on]:text-yellow-400 data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle eureka"
                    >
                        <Lightbulb className={cn("h-4 w-4 shrink-0", visibleViews.has('eureka') && "fill-yellow-500 text-yellow-500")} />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            顿悟
                        </span>
                    </Toggle>
                </div>

                {/* 全屏切换按钮 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={onToggleFullscreen}
                    title={isFullscreen ? DICT.common.exitFullscreen : DICT.common.enterFullscreen}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </div>
            {/* 标签 (桌面端显示) - 限制显示 2 个，防止挤占空间 */}
            <div className="hidden sm:flex ml-auto shrink-0 pl-2">
                <SmartTagList
                    tags={question.tags || []}
                    tagNames={question.tagNames}
                    limit={2}
                />
            </div>
        </div>
    );
}
