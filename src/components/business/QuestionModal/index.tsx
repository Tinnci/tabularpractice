"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Question, Status } from "@/lib/types";
import { getBilibiliEmbed } from "@/lib/utils";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { EurekaPanel } from "@/components/business/Core";
import { QuestionEditPanel } from "@/components/question";
import { useProgressStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DICT, formatQuestionNumber } from "@/lib/i18n";
import { toast } from "sonner";
import { GitHubRepoSetupGuide } from "../Settings";

// 导入子组件
import { QuestionHeader } from "./QuestionHeader";
import { QuestionContent } from "./QuestionContent";
import { QuestionFooter } from "./QuestionFooter";
import { useQuestionSync } from "./useQuestionSync";
import { useQuestionModal } from "./useQuestionModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    onUpdateStatus: (id: string, status: Status) => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    isLoading?: boolean;
}

export function QuestionModal({
    isOpen, onClose, question, onUpdateStatus,
    onPrev, onNext, hasPrev, hasNext, isLoading
}: Props) {
    // 笔记系统状态
    const { notes, updateNote, syncStatus, syncData, setTime } = useProgressStore();

    // 使用 QuestionModal 业务逻辑 Hook
    const {
        visibleViews,
        isEditing,
        isFullscreen,
        showGitHubGuide,
        isStarred,
        toggleView,
        setIsEditing,
        setIsFullscreen,
        setShowGitHubGuide,
        toggleStar,
        handleStatusUpdate,
    } = useQuestionModal({
        isOpen,
        question,
        hasPrev,
        hasNext,
        onPrev,
        onNext,
        onClose,
        onUpdateStatus,
        onTimerToggle: () => { }, // 临时占位，将在下面被 toggle 覆盖
    });

    // 计时器逻辑 (增强版：支持累计时间)
    const {
        isRunning, reset, formattedTime, toggle,
        hasHistory, formattedTotalTime, formattedHistoricalTime,
        questionStatus, historicalTime
    } = useQuestionTimer({
        questionId: question?.id,
        visibleViews,
        isOpen
    });

    // 同步逻辑
    const { syncQuestion } = useQuestionSync({
        onSuccess: () => setIsEditing(false),
    });

    if (!question && !isLoading) return null;

    // 如果正在加载，显示加载骨架屏或 Loading 状态，但保持 Dialog 结构
    const currentQuestion = question || {} as Question;
    const videoEmbedUrl = currentQuestion.videoUrl ? getBilibiliEmbed(currentQuestion.videoUrl) : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className={cn(
                    "w-screen max-w-[100vw] h-[100dvh] flex flex-col p-0 gap-0 outline-none overflow-hidden transition-all duration-300",
                    isFullscreen
                        ? "sm:max-w-[100vw] sm:h-[100vh] rounded-none"
                        : "sm:max-w-5xl sm:h-[95vh] sm:rounded-xl"
                )}>
                    <DialogTitle className="sr-only">{formatQuestionNumber(currentQuestion.number)}</DialogTitle>

                    {/* 1. 头部信息与工具栏 */}
                    <QuestionHeader
                        question={currentQuestion}
                        isLoading={isLoading}
                        isStarred={isStarred}
                        isEditing={isEditing}
                        isFullscreen={isFullscreen}
                        syncStatus={syncStatus}
                        questionStatus={questionStatus as Status | 'unanswered' | undefined}
                        visibleViews={visibleViews}
                        videoEmbedUrl={videoEmbedUrl}
                        formattedTime={formattedTime}
                        isRunning={isRunning}
                        hasHistory={hasHistory}
                        formattedTotalTime={formattedTotalTime}
                        formattedHistoricalTime={formattedHistoricalTime}
                        historicalTime={historicalTime}
                        onToggleStar={toggleStar}
                        onToggleEdit={() => setIsEditing(!isEditing)}
                        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                        onToggleView={toggleView}
                        onTimerToggle={toggle}
                        onTimerReset={() => reset(false)}
                        onSetTime={(totalMs) => currentQuestion.id && setTime(currentQuestion.id, totalMs)}
                        onSyncRetry={() => syncData()}
                    />

                    {/* 2. 内容瀑布流区域 */}
                    <div className="flex-1 min-h-0 bg-muted/30 relative flex">
                        {/* 左侧：内容区 (编辑模式下收窄) */}
                        <div className={cn(
                            "flex-1 min-h-0 transition-all duration-300",
                            isEditing && "hidden sm:block sm:flex-[2]"
                        )}>
                            {question && (
                                <QuestionContent
                                    question={question}
                                    isLoading={isLoading}
                                    isFullscreen={isFullscreen}
                                    visibleViews={visibleViews}
                                    videoEmbedUrl={videoEmbedUrl}
                                    notes={notes}
                                    onUpdateNote={updateNote}
                                />
                            )}
                        </div>

                        {/* 右侧：编辑面板 */}
                        {isEditing && question && (
                            <div className="w-full sm:w-[400px] sm:flex-1 border-l bg-card">
                                <QuestionEditPanel
                                    question={question}
                                    onSave={async (updatedQuestion) => {
                                        const result = await syncQuestion(question, updatedQuestion);
                                        if (result.needsConfig) {
                                            setShowGitHubGuide(true);
                                        }
                                    }}
                                    onCancel={() => setIsEditing(false)}
                                />
                            </div>
                        )}

                        {/* 右侧：顿悟面板 */}
                        {visibleViews.has('eureka') && question && (
                            <div className="w-full sm:w-[350px] border-l bg-card shrink-0 h-full">
                                <EurekaPanel
                                    question={question}
                                    onClose={() => toggleView('eureka')}
                                />
                            </div>
                        )}
                    </div>

                    {/* 3. 底部操作栏 */}
                    <QuestionFooter
                        hasPrev={hasPrev}
                        hasNext={hasNext}
                        isLoading={isLoading}
                        onPrev={onPrev}
                        onNext={onNext}
                        onStatusUpdate={handleStatusUpdate}
                    />

                </DialogContent>
            </Dialog>

            {/* GitHub 仓库配置引导 */}
            <GitHubRepoSetupGuide
                isOpen={showGitHubGuide}
                onClose={() => setShowGitHubGuide(false)}
                onSuccess={() => {
                    toast.success(DICT.syncToast.configSuccess);
                }}
            />
        </>
    );
}
