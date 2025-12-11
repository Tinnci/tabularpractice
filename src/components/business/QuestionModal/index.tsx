"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Question, Status, ViewType } from "@/lib/types";
import { getBilibiliEmbed, getImageUrl } from "@/lib/utils";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { EurekaPanel } from "@/components/business/Eureka/EurekaPanel";
import { QuestionEditPanel } from "@/components/question";
import { useProgressStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DICT, formatQuestionNumber } from "@/lib/i18n";
import { toast } from "sonner";
import { GitHubRepoSetupGuide } from "../GitHubRepoSetupGuide";

// 导入子组件
import { QuestionHeader } from "./QuestionHeader";
import { QuestionContent } from "./QuestionContent";
import { QuestionFooter } from "./QuestionFooter";
import { useQuestionSync } from "./useQuestionSync";

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

    const [visibleViews, setVisibleViews] = useState<Set<ViewType>>(new Set(['question']));

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

    // 笔记系统状态
    const { notes, updateNote, stars, toggleStar, syncStatus, syncData, setTime } = useProgressStore();

    // 编辑器状态
    const [isEditing, setIsEditing] = useState(false);
    const [showGitHubGuide, setShowGitHubGuide] = useState(false);

    const [isFullscreen, setIsFullscreen] = useState(false);

    const isStarred = question ? !!stars[question.id] : false;

    // 同步逻辑
    const { syncQuestion } = useQuestionSync({
        onSuccess: () => setIsEditing(false),
    });

    // 带反馈的状态更新处理
    const handleStatusUpdate = useCallback((status: Status) => {
        if (!question?.id) return;

        onUpdateStatus(question.id, status);

        // Toast 反馈
        const statusConfig = {
            mastered: {
                label: DICT.status.mastered,
                icon: '✓',
                className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
            },
            confused: {
                label: DICT.status.confused,
                icon: '?',
                className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300'
            },
            failed: {
                label: DICT.status.failed,
                icon: '✗',
                className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
            },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        if (config) {
            toast(`已标记为 ${config.label}`, {
                duration: 1500,
                position: 'bottom-center',
                className: config.className,
            });
        }
    }, [question, onUpdateStatus]);

    // 记录最后打开的题目 ID
    const { setLastQuestionId } = useProgressStore();
    const questionId = question?.id;

    // [修复] 新增 Ref：追踪上一次初始化视图时的题目 ID，防止 AutoSync 导致的意外重置
    const lastInitializedIdRef = useRef<string | null>(null);

    // [修复] 改造 useEffect:仅在 questionId 真正改变且不为空时重置视图
    useEffect(() => {
        // 只有当 isOpen 为 true,且 questionId 存在,且与上次初始化的 ID 不同时才执行
        if (isOpen && questionId && questionId !== lastInitializedIdRef.current) {
            // React 18+ 会自动批量更新多个 setState
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVisibleViews(new Set(['question']));

            setLastQuestionId(questionId);
            lastInitializedIdRef.current = questionId; // 更新记录
        }
    }, [questionId, isOpen, setLastQuestionId]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case "ArrowLeft":
                if (hasPrev && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    onPrev();
                }
                break;
            case "ArrowRight":
                if (hasNext && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    onNext();
                }
                break;
            case "Escape":
                onClose();
                break;
            case "1":
                handleStatusUpdate('mastered');
                break;
            case "2":
                handleStatusUpdate('confused');
                break;
            case "3":
                handleStatusUpdate('failed');
                break;
            case " ": // Space key
                // 防止在输入笔记时触发暂停
                if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
                e.preventDefault();
                toggle();
                break;
        }
    }, [isOpen, hasPrev, hasNext, onPrev, onNext, onClose, handleStatusUpdate, toggle]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // 预加载当前题目的答案和解析图片，确保点击切换时秒开
    useEffect(() => {
        if (!question) return;

        // 检查省流量模式
        if (useProgressStore.getState().lowDataMode) return;

        const { repoBaseUrl, repoSources } = useProgressStore.getState();

        const preload = (url?: string) => {
            if (!url) return;
            const finalUrl = getImageUrl(url, question, repoBaseUrl, repoSources);
            if (finalUrl) {
                const img = new Image();
                img.src = finalUrl;
            }
        };

        preload(question.answerImg);
        preload(question.analysisImg);
    }, [question]);

    if (!question && !isLoading) return null;

    // 如果正在加载，显示加载骨架屏或 Loading 状态，但保持 Dialog 结构
    const currentQuestion = question || {} as Question;
    const videoEmbedUrl = currentQuestion.videoUrl ? getBilibiliEmbed(currentQuestion.videoUrl) : null;

    const toggleView = (view: ViewType) => {
        const newSet = new Set(visibleViews);
        if (newSet.has(view)) {
            newSet.delete(view);
        } else {
            newSet.add(view);
        }
        setVisibleViews(newSet);
    };

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
                        onToggleStar={() => currentQuestion.id && toggleStar(currentQuestion.id)}
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
