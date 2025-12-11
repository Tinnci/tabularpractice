"use client";

import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Question, Status, ViewType } from "@/lib/types";
import { getBilibiliEmbed, getBilibiliTimestamp, formatTimestamp } from "@/lib/utils";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { QuestionTimer } from "@/components/business/QuestionTimer";
import { EurekaPanel } from "@/components/business/Eureka/EurekaPanel";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Check, X, HelpCircle, BookOpen, Eye, FileText,
    Copy, Edit2,
    ChevronLeft, ChevronRight, MonitorPlay, PenLine, Star,
    Loader2, ExternalLink, Clock, Pencil,
    Maximize2, Minimize2, Lightbulb
} from "lucide-react";
import { useProgressStore } from "@/lib/store";
import { cn, getImageUrl } from "@/lib/utils";

// 使用共享的渲染组件
import { MarkdownContent, RemoteImage, QuestionEditPanel, DraftPanel, NotePanel } from "@/components/question";

import { DICT, getQuestionTypeLabel, formatQuestionNumber } from "@/lib/i18n";
import { toast } from "sonner";
import { GitHubRepoSetupGuide } from "./GitHubRepoSetupGuide";
import { githubEditor } from "@/services/githubEditor";

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



// --- Helper: 使用统一的标签 API ---
import { getTagLabel } from "@/data/subject-tags";

// --- Component: 智能标签列表 ---
const SmartTagList = ({
    tags = [],
    tagNames = [],
    limit = 2,
    className
}: {
    tags: string[],
    tagNames?: string[],
    limit?: number,
    className?: string
}) => {
    // 预处理所有标签的最终显示文本
    const displayTags = useMemo(() => {
        return tags.map((tagId, index) => {
            // 优先级: 1. 后端传回的名称 -> 2. 本地映射的中文 -> 3. 原始ID
            return tagNames?.[index] || getTagLabel(tagId);
        });
    }, [tags, tagNames]);

    if (displayTags.length === 0) return null;

    // 分割为“可见部分”和“隐藏部分”
    const visibleTags = displayTags.slice(0, limit);
    const hiddenTags = displayTags.slice(limit);
    const hasHidden = hiddenTags.length > 0;

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            {visibleTags.map((tag, index) => (
                <Badge
                    key={index}
                    variant="outline"
                    className="text-xs font-normal text-muted-foreground bg-muted/30 whitespace-nowrap h-6 px-2 hover:bg-muted/50 cursor-default border-muted-foreground/20"
                >
                    {tag}
                </Badge>
            ))}

            {hasHidden && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="secondary"
                                className="text-xs h-6 px-1.5 cursor-default hover:bg-secondary/80 transition-colors"
                                title={DICT.practice.moreTags}
                            >
                                +{hiddenTags.length}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-[250px] p-3 bg-popover text-popover-foreground border shadow-md">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground">{DICT.practice.includedTags}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hiddenTags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-normal bg-muted/50">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

const CopyButton = ({ text, img, question }: { text?: string | null, img?: string | null, question: Question }) => {
    const [copied, setCopied] = useState(false);
    const { repoBaseUrl, repoSources } = useProgressStore();

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (text) {
                // 1. 优先复制 Markdown 文本
                await navigator.clipboard.writeText(text);
            } else if (img) {
                // 2. 尝试复制图片
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (!url) return;

                // 获取图片 Blob 并写入剪贴板
                // 注意：这需要图片服务器支持 CORS，否则会抛出错误
                const response = await fetch(url);
                const blob = await response.blob();

                // Safari/Chrome 均支持的写入方式
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
            }

            // 成功反馈
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);

            // 降级处理：如果图片数据复制失败（通常是跨域问题），则复制图片链接
            if (!text && img) {
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (url) {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    // 可选：这里可以用 sonner 提示 "已复制图片链接"
                }
            }
        }
    };

    // 如果既没有文本也没有图片，不渲染按钮
    if (!text && !img) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/50 data-[state=open]:bg-muted"
            onClick={handleCopy}
            title={text ? DICT.common.copyMarkdown : DICT.common.copyImage}
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground" />
            )}
        </Button>
    );
};

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



    // [修复] 已删除重复的 useEffect，其功能已合并到上方的 lastInitializedIdRef 逻辑中

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

    // This code is too long to replace in one go accurately with safe matching without context.
    // I will split this into chunks.
    // Chunk 1: Header (Title, Star, Sync, View Toggles, Fullscreen)
    // Chunk 2: Content Body (Loading, Question, Video, Answer, Analysis)
    // Chunk 3: Tools (Draft, Note)
    // Chunk 4: Footer (Prev, Status Buttons, Next)

    // Wait, I can try to replace chunks by finding unique large blocks.

    // Chunk 1: Header to View Toggles
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
                    <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-background flex items-center justify-between z-20 shadow-sm shrink-0 gap-2 h-14 sm:h-auto max-w-[100vw] overflow-hidden">
                        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden flex-1 min-w-0">
                            <div className="flex flex-col shrink-0">
                                <span className="text-sm font-bold text-foreground flex items-center gap-1 sm:gap-2">
                                    <span className="sm:hidden">{formatQuestionNumber(currentQuestion.number, true)}</span>
                                    <span className="hidden sm:inline">{formatQuestionNumber(currentQuestion.number)}</span>
                                    {question && (
                                        <QuestionTimer
                                            formattedTime={formattedTime}
                                            isRunning={isRunning}
                                            toggle={toggle}
                                            reset={() => reset(false)}
                                            className="ml-2 sm:ml-4"
                                            hasHistory={hasHistory}
                                            formattedTotalTime={formattedTotalTime}
                                            formattedHistoricalTime={formattedHistoricalTime}
                                            historicalTimeMs={historicalTime}
                                            questionId={question?.id}
                                            onSetTime={(totalMs) => question?.id && setTime(question.id, totalMs)}
                                        />
                                    )}
                                    {/* 收藏按钮 */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-yellow-500"
                                        onClick={() => currentQuestion.id && toggleStar(currentQuestion.id)}
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
                                        onClick={() => setIsEditing(!isEditing)}
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
                                            onClick={() => syncData()}
                                        />
                                    )}
                                </span>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{getQuestionTypeLabel(currentQuestion.type)}</span>
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
                                        onPressedChange={() => toggleView('video')}
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
                                    onPressedChange={() => toggleView('answer')}
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
                                    onPressedChange={() => toggleView('analysis')}
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
                                    onPressedChange={() => toggleView('note')}
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
                                    onPressedChange={() => toggleView('draft')}
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
                                    onPressedChange={() => toggleView('eureka')}
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
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                title={isFullscreen ? DICT.common.exitFullscreen : DICT.common.enterFullscreen}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>
                        {/* 标签 (桌面端显示) - 限制显示 2 个，防止挤占空间 */}
                        <div className="hidden sm:flex ml-auto shrink-0 pl-2">
                            <SmartTagList
                                tags={currentQuestion.tags || []}
                                tagNames={currentQuestion.tagNames}
                                limit={2}
                            />
                        </div>
                    </div>

                    {/* 2. 内容瀑布流区域 */}
                    <div className="flex-1 min-h-0 bg-muted/30 relative flex">
                        {/* 左侧：内容区 (编辑模式下收窄) */}
                        <div className={cn(
                            "flex-1 min-h-0 transition-all duration-300",
                            isEditing && "hidden sm:block sm:flex-[2]"
                        )}>
                            {isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-50 bg-background/50 backdrop-blur-sm">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-sm">{DICT.common.loadingQuestion}</span>
                                </div>
                            ) : (
                                <ScrollArea className="h-full">
                                    {/* key={currentQuestion.id} 强制 React 在题目切换时重新渲染整个内容区域，
                                解决"切换下一题但内容未刷新"的问题，并重置图片加载状态 */}
                                    <div key={currentQuestion.id} className={cn(
                                        "p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 mx-auto pb-20 animate-in fade-in duration-300 transition-all ease-in-out",
                                        isFullscreen ? "max-w-[1600px]" : "max-w-4xl"
                                    )}>


                                        {/* 移动端标签显示 - 移动端可以多显示几个，或者全显示 */}
                                        <div className="sm:hidden mb-2">
                                            <SmartTagList
                                                tags={currentQuestion.tags || []}
                                                tagNames={currentQuestion.tagNames}
                                                limit={5} // 移动端允许换行，可以多显示一些
                                                className="gap-1.5"
                                            />
                                        </div>

                                        {/* 题目区域 */}
                                        {visibleViews.has('question') && (
                                            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                                                <div className="bg-muted/50 border-b px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {DICT.exam.questionDesc}
                                                    </div>
                                                    <CopyButton
                                                        text={currentQuestion.contentMd}
                                                        img={currentQuestion.contentImg}
                                                        question={currentQuestion}
                                                    />
                                                </div>
                                                <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                                                    {currentQuestion.contentMd ? (
                                                        <div className="w-full p-2">
                                                            <MarkdownContent content={currentQuestion.contentMd} />
                                                        </div>
                                                    ) : (currentQuestion.contentImg) ? (
                                                        <RemoteImage
                                                            src={currentQuestion.contentImg || ''}
                                                            alt={DICT.exam.questionDesc}
                                                            question={currentQuestion}
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground text-sm">{DICT.exam.contentMissing}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 视频区域 */}
                                        {visibleViews.has('video') && videoEmbedUrl && (
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-black rounded-xl border shadow-sm overflow-hidden aspect-video ring-2 ring-blue-100 relative group">
                                                    <iframe
                                                        src={videoEmbedUrl}
                                                        className="w-full h-full"
                                                        scrolling="no"
                                                        frameBorder="0"
                                                        allowFullScreen
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        title={DICT.exam.video}
                                                        // @ts-expect-error - playsInline is not in iframe type definition but is needed for iOS
                                                        playsInline
                                                    />

                                                    {/* 时间戳提示 - 仅在有时间戳时显示 */}
                                                    {(() => {
                                                        const timestamp = question?.videoUrl ? getBilibiliTimestamp(question.videoUrl) : null;
                                                        if (timestamp !== null) {
                                                            return (
                                                                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>{DICT.exam.videoStartAt.replace('{time}', formatTimestamp(timestamp))}</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>

                                                {/* 新增：iOS/移动端友好跳转按钮 */}
                                                {question?.videoUrl && (
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 text-xs h-8 bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-900/20 dark:border-pink-900 dark:text-pink-300"
                                                            onClick={() => window.open(question.videoUrl, '_blank')}
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            {/* 提示用户去 App 看，体验更好 */}
                                                            <span className="sm:hidden">{DICT.exam.openInBilibiliMobile}</span>
                                                            <span className="hidden sm:inline">{DICT.exam.openInBilibiliWeb}</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 答案区域 */}
                                        {visibleViews.has('answer') && (
                                            <div className="bg-card rounded-xl border border-green-100 dark:border-green-900 shadow-sm overflow-hidden">
                                                <div className="bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                                    <div className="flex items-center gap-2">
                                                        <Eye className="w-4 h-4" /> {DICT.exam.referenceAnswer}
                                                    </div>
                                                    <CopyButton
                                                        text={currentQuestion.answerMd || (currentQuestion.answer ? DICT.exam.answerLabel.replace('{answer}', currentQuestion.answer) : null)}
                                                        img={currentQuestion.answerImg}
                                                        question={currentQuestion}
                                                    />
                                                </div>
                                                <div className="p-4 sm:p-6 flex justify-center">
                                                    {currentQuestion.answerMd ? (
                                                        <div className="w-full text-left">
                                                            <MarkdownContent content={currentQuestion.answerMd} />
                                                        </div>
                                                    ) : currentQuestion.answerImg ? (
                                                        <RemoteImage
                                                            src={currentQuestion.answerImg}
                                                            alt={DICT.exam.answer}
                                                            question={currentQuestion}
                                                        />
                                                    ) : currentQuestion.answer ? (
                                                        <div className="w-full text-left">
                                                            <MarkdownContent content={currentQuestion.answer} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">{DICT.exam.noAnswer}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 解析区域 */}
                                        {visibleViews.has('analysis') && (
                                            <div className="bg-card rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden">
                                                <div className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" /> {DICT.exam.detailedAnalysis}
                                                    </div>
                                                    <CopyButton
                                                        text={currentQuestion.analysisMd}
                                                        img={currentQuestion.analysisImg}
                                                        question={currentQuestion}
                                                    />
                                                </div>
                                                <div className="p-4 sm:p-6 flex justify-center">
                                                    {currentQuestion.analysisMd ? (
                                                        <div className="w-full text-left">
                                                            <MarkdownContent content={currentQuestion.analysisMd} />
                                                        </div>
                                                    ) : currentQuestion.analysisImg ? (
                                                        <RemoteImage
                                                            src={currentQuestion.analysisImg}
                                                            alt={DICT.exam.analysis}
                                                            question={currentQuestion}
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">{DICT.exam.noAnalysis}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 草稿区域 */}
                                        <DraftPanel
                                            key={`draft-${currentQuestion.id}`}
                                            questionId={currentQuestion.id}
                                            isVisible={visibleViews.has('draft')}
                                        />

                                        {/* 笔记区域 */}
                                        <NotePanel
                                            key={`note-${currentQuestion.id}`}
                                            questionId={currentQuestion.id}
                                            initialContent={notes[currentQuestion.id]}
                                            onUpdateNote={updateNote}
                                            isVisible={visibleViews.has('note')}
                                        />

                                    </div>
                                </ScrollArea>
                            )}
                        </div>


                        {/* 右侧：编辑面板 */}
                        {isEditing && question && (
                            <div className="w-full sm:w-[400px] sm:flex-1 border-l bg-card">
                                <QuestionEditPanel
                                    question={question}
                                    onSave={async (updatedQuestion) => {
                                        try {
                                            const { githubToken } = useProgressStore.getState();

                                            // 1. 检查是否有 GitHub token
                                            if (!githubToken) {
                                                toast.info(DICT.syncToast.savedLocally, {
                                                    description: DICT.syncToast.configureTokenDesc,
                                                    action: {
                                                        label: DICT.syncToast.configureNow,
                                                        onClick: () => setShowGitHubGuide(true)
                                                    }
                                                });
                                                console.log('[QuestionEditor] Saved locally:', updatedQuestion);
                                                setIsEditing(false);
                                                return;
                                            }

                                            // 2. 检查 token 权限
                                            const permissionCheck = await githubEditor.checkRepoPermission();
                                            if (!permissionCheck.hasPermission) {
                                                toast.warning(DICT.syncToast.tokenNoPermission, {
                                                    description: permissionCheck.error,
                                                    action: {
                                                        label: DICT.syncToast.reconfigure,
                                                        onClick: () => setShowGitHubGuide(true)
                                                    }
                                                });
                                                console.log('[QuestionEditor] Saved locally:', updatedQuestion);
                                                setIsEditing(false);
                                                return;
                                            }

                                            // 3. 尝试同步到远程
                                            // 需要知道题目来源于哪个仓库
                                            if (!question.sourceUrl) {
                                                toast.error(DICT.syncToast.syncFailed, {
                                                    description: DICT.syncToast.noRepoInfo
                                                });
                                                console.log('[QuestionEditor] Saved locally (no sourceUrl):', updatedQuestion);
                                                setIsEditing(false);
                                                return;
                                            }

                                            // 解析仓库信息
                                            const repoInfo = githubEditor.parseRepoUrl(question.sourceUrl);
                                            if (!repoInfo) {
                                                toast.error(DICT.syncToast.parseRepoFailed, {
                                                    description: `${DICT.syncToast.invalidRepoUrl}: ${question.sourceUrl}`
                                                });
                                                console.log('[QuestionEditor] Saved locally (invalid repo):', updatedQuestion);
                                                setIsEditing(false);
                                                return;
                                            }

                                            // 构建文件路径 (假设题目文件路径为: data/questions/${paperId}/${questionId}.json)
                                            // 你需要根据实际的题库结构调整这个路径
                                            const filePath = `data/questions/${question.paperId}/index.json`;

                                            toast.promise(
                                                (async () => {
                                                    // 获取现有文件
                                                    const fileContent = await githubEditor.getFile(
                                                        repoInfo.owner,
                                                        repoInfo.repo,
                                                        filePath,
                                                        repoInfo.branch
                                                    );

                                                    // 解码并解析 JSON
                                                    const decodedContent = githubEditor.decodeContent(fileContent.content);
                                                    const questions = JSON.parse(decodedContent) as Question[];

                                                    // 找到并更新题目
                                                    const index = questions.findIndex(q => q.id === updatedQuestion.id);
                                                    if (index === -1) {
                                                        throw new Error('在文件中找不到该题目');
                                                    }

                                                    // 合并更新（保留原有字段，覆盖修改的字段）
                                                    questions[index] = {
                                                        ...questions[index],
                                                        ...updatedQuestion
                                                    };

                                                    // 更新文件
                                                    const result = await githubEditor.updateFile(
                                                        repoInfo.owner,
                                                        repoInfo.repo,
                                                        filePath,
                                                        JSON.stringify(questions, null, 2),
                                                        `chore: 更新题目 ${updatedQuestion.id}`,
                                                        fileContent.sha,
                                                        repoInfo.branch || 'main'
                                                    );

                                                    return result;
                                                })(),
                                                {
                                                    loading: DICT.syncToast.syncing,
                                                    success: (result) => {
                                                        setIsEditing(false);
                                                        return `${DICT.syncToast.syncSuccess} (${result.commit.sha.slice(0, 7)})`;
                                                    },
                                                    error: (error) => {
                                                        console.error('[QuestionEditor] Sync failed:', error);
                                                        return `${DICT.syncToast.syncFailed}: ${error.message}`;
                                                    }
                                                }
                                            );

                                        } catch (error) {
                                            console.error('[QuestionEditor] Error:', error);
                                            toast.error(DICT.syncToast.saveFailed, {
                                                description: error instanceof Error ? error.message : String(error)
                                            });
                                        }
                                    }}
                                    onCancel={() => setIsEditing(false)}
                                />
                            </div>
                        )}

                        {/* 右侧：顿悟面板 */}
                        {visibleViews.has('eureka') && (
                            <div className="w-full sm:w-[350px] border-l bg-card shrink-0 h-full">
                                <EurekaPanel
                                    question={currentQuestion}
                                    onClose={() => toggleView('eureka')}
                                />
                            </div>
                        )}
                    </div>
                    {/* 3. 底部操作栏 - 响应式优化 */}
                    <div className="p-2 sm:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-4 border-t bg-background grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">

                        {/* 左侧：上一题 - 移动端仅图标 */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={onPrev}
                                        disabled={!hasPrev || isLoading}
                                        size="icon"
                                        className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-1" />
                                        <span className="hidden sm:inline">{DICT.common.prev}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{DICT.common.shortcutPrev}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 中间：状态操作按钮 - 移动端紧凑布局 */}
                        <div className="flex justify-center gap-2 sm:gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => handleStatusUpdate('mastered')}
                                            disabled={isLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="text-xs sm:text-sm">{DICT.status.mastered}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{DICT.status.shortcutMastered}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => handleStatusUpdate('confused')}
                                            disabled={isLoading}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            <span className="text-xs sm:text-sm">{DICT.status.confused}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{DICT.status.shortcutConfused}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => handleStatusUpdate('failed')}
                                            disabled={isLoading}
                                            className="bg-red-600 hover:bg-red-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="text-xs sm:text-sm">{DICT.status.failed}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{DICT.status.shortcutFailed}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* 右侧：下一题 - 移动端仅图标 */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={onNext}
                                        disabled={!hasNext || isLoading}
                                        size="icon"
                                        className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    >
                                        <span className="hidden sm:inline">{DICT.common.next}</span>
                                        <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5 sm:ml-1" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{DICT.common.shortcutNext}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

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
