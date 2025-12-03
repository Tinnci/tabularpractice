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
import { Question, Status } from "@/lib/types";
import { getBilibiliEmbed, getBilibiliTimestamp, formatTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "@/components/ui/sketch-canvas";
import { GpuSketchCanvas } from "@/components/ui/sketch-canvas/gpu";
import {
    Check, X, HelpCircle, BookOpen, Eye, FileText,
    ChevronLeft, ChevronRight, MonitorPlay, PenLine, Star,
    Loader2, ImageOff, ExternalLink, Clock, Pencil, Eraser, Undo, Trash2,
    Maximize2, Minimize2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useProgressStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { cn, getImageUrl } from "@/lib/utils";
import { useTheme } from "next-themes";

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

type ViewType = 'question' | 'answer' | 'analysis' | 'video' | 'note' | 'draft';

// 通用 Markdown 渲染组件
const MarkdownContent = ({ content }: { content: string }) => (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
        >
            {content}
        </ReactMarkdown>
    </div>
);

// 远程图片加载组件
const RemoteImage = ({ src, alt, className, question }: { src: string, alt: string, className?: string, question?: Question | null }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { repoBaseUrl, repoSources } = useProgressStore.getState();

    const finalSrc = useMemo(() => {
        return getImageUrl(src, question, repoBaseUrl, repoSources);
    }, [src, question, repoBaseUrl, repoSources]);

    if (!finalSrc) return null;

    return (
        <div className={cn("relative min-h-[100px] flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden", className)}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}
            {error ? (
                <div className="flex flex-col items-center text-muted-foreground text-xs p-4">
                    <ImageOff className="w-6 h-6 mb-2 opacity-50" />
                    <span>图片加载失败</span>
                </div>
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={finalSrc}
                    alt={alt}
                    className={cn("max-w-full h-auto object-contain transition-opacity duration-300 dark:invert", loading ? "opacity-0" : "opacity-100")}
                    onLoad={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                />
            )}
        </div>
    )
}

export function QuestionModal({
    isOpen, onClose, question, onUpdateStatus,
    onPrev, onNext, hasPrev, hasNext, isLoading
}: Props) {

    const [visibleViews, setVisibleViews] = useState<Set<ViewType>>(new Set(['question']));

    // 笔记系统状态
    const { notes, updateNote, stars, toggleStar, syncStatus, syncData } = useProgressStore();
    const [noteContent, setNoteContent] = useState("");
    const [isEditingNote, setIsEditingNote] = useState(false);

    // 草稿系统状态
    const { theme } = useTheme();
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeColor, setStrokeColor] = useState("#000000");

    // 监听主题变化，自动调整笔刷颜色 (仅当当前颜色为黑/白时)
    useEffect(() => {
        if (theme === 'dark') {
            // 只有当前是黑色时，才自动转为白色
            if (strokeColor === "#000000") {
                setStrokeColor("#FFFFFF");
            }
        } else {
            // 只有当前是白色时，才自动转为黑色
            if (strokeColor === "#FFFFFF") {
                setStrokeColor("#000000");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);
    const [strokeWidth] = useState(4);
    const [eraserMode, setEraserMode] = useState(false);
    const [onlyPenMode, setOnlyPenMode] = useState(false);
    const [useGpu, setUseGpu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const isStarred = question ? !!stars[question.id] : false;

    // 初始化笔记内容
    useEffect(() => {
        if (question) {
            setNoteContent(notes[question.id] || "");
        }
    }, [question, notes]);

    // 加载草稿内容
    useEffect(() => {
        const loadDraft = async () => {
            if (question && canvasRef.current && visibleViews.has('draft')) {
                // 重置画布
                canvasRef.current.clearCanvas();

                try {
                    // 从 IndexedDB 读取
                    const { draftStore } = await import('@/lib/draftStore');
                    const savedDraft = await draftStore.getDraft(question.id);

                    if (savedDraft) {
                        const paths = JSON.parse(savedDraft);

                        // 颜色自适应转换逻辑
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const transformedPaths = paths.map((path: any) => {
                            // 如果是黑色且当前是深色模式 -> 转为白色
                            if (path.strokeColor === "#000000" && theme === 'dark') {
                                return { ...path, strokeColor: "#FFFFFF" };
                            }
                            // 如果是白色且当前是浅色模式 -> 转为黑色
                            if (path.strokeColor === "#FFFFFF" && theme !== 'dark') {
                                return { ...path, strokeColor: "#000000" };
                            }
                            return path;
                        });

                        canvasRef.current.loadPaths(transformedPaths);
                    }
                } catch (e) {
                    console.error("Failed to load draft", e);
                }
            }
        };
        loadDraft();
    }, [question, visibleViews, theme]);

    // 自动保存笔记
    const handleNoteBlur = () => {
        if (question && noteContent !== notes[question.id]) {
            updateNote(question.id, noteContent);
        }
    };

    // 记录最后打开的题目 ID
    const { setLastQuestionId } = useProgressStore();
    const questionId = question?.id;

    useEffect(() => {
        if (isOpen && questionId) {
            setVisibleViews(new Set(['question']));
            setLastQuestionId(questionId);
        }
    }, [questionId, isOpen, setLastQuestionId]);

    // 保存草稿
    const saveDraft = useCallback(async () => {
        if (question && canvasRef.current) {
            try {
                const paths = await canvasRef.current.exportPaths();
                const { draftStore } = await import('@/lib/draftStore');

                if (paths.length > 0) {
                    await draftStore.saveDraft(question.id, JSON.stringify(paths));
                } else {
                    // 如果为空，删除草稿
                    await draftStore.deleteDraft(question.id);
                }
            } catch (e) {
                console.error("Failed to save draft", e);
            }
        }
    }, [question]);

    // 防抖保存草稿，避免每笔画都触发昂贵的 exportPaths 和 store 更新
    const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSaveDraft = useCallback(() => {
        if (saveDraftTimeoutRef.current) {
            clearTimeout(saveDraftTimeoutRef.current);
        }
        saveDraftTimeoutRef.current = setTimeout(() => {
            saveDraft();
        }, 500); // 500ms 防抖
    }, [saveDraft]);

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            if (saveDraftTimeoutRef.current) {
                clearTimeout(saveDraftTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen && question) {
            setVisibleViews(new Set(['question']));
        }
    }, [question, isOpen]);

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
                if (question) onUpdateStatus(question.id, 'mastered');
                break;
            case "2":
                if (question) onUpdateStatus(question.id, 'confused');
                break;
            case "3":
                if (question) onUpdateStatus(question.id, 'failed');
                break;
        }
    }, [isOpen, hasPrev, hasNext, onPrev, onNext, onClose, question, onUpdateStatus]);

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn(
                "w-screen max-w-[100vw] h-[100dvh] flex flex-col p-0 gap-0 outline-none overflow-hidden transition-all duration-300",
                isFullscreen
                    ? "sm:max-w-[100vw] sm:h-[100vh] rounded-none"
                    : "sm:max-w-5xl sm:h-[95vh] sm:rounded-xl"
            )}>
                <DialogTitle className="sr-only">{`第 ${currentQuestion.number} 题`}</DialogTitle>

                {/* 1. 头部信息与工具栏 */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-background flex items-center justify-between z-20 shadow-sm shrink-0 gap-2 h-14 sm:h-auto max-w-[100vw] overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden flex-1 min-w-0">
                        <div className="flex flex-col shrink-0">
                            <span className="text-sm font-bold text-foreground flex items-center gap-1 sm:gap-2">
                                <span className="sm:hidden text-muted-foreground">#</span>
                                <span>{currentQuestion.number}</span>
                                <span className="hidden sm:inline">第 {currentQuestion.number} 题</span>
                                {/* 收藏按钮 */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-yellow-500"
                                    onClick={() => currentQuestion.id && toggleStar(currentQuestion.id)}
                                    title={isStarred ? "取消收藏" : "收藏题目"}
                                    disabled={isLoading}
                                >
                                    <Star className={cn("w-4 h-4", isStarred && "fill-yellow-500 text-yellow-500")} />
                                </Button>
                                {syncStatus === 'syncing' && (
                                    <span title="同步中...">
                                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                    </span>
                                )}
                                {syncStatus === 'error' && (
                                    <div
                                        className="w-2 h-2 rounded-full bg-red-500 cursor-pointer hover:bg-red-600 transition-colors"
                                        title="同步失败，点击重试"
                                        onClick={() => syncData()}
                                    />
                                )}
                            </span>
                            <span className="hidden sm:inline text-[10px] sm:text-xs text-muted-foreground">{currentQuestion.type}</span>
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
                                        视频
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
                                    答案
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
                                    解析
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
                                    笔记
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
                                    草稿
                                </span>
                            </Toggle>
                        </div>

                        {/* 全屏切换按钮 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title={isFullscreen ? "退出全屏" : "全屏显示"}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </div>
                    {/* 标签 (桌面端显示) */}
                    <div className="hidden sm:flex items-center gap-2 flex-wrap">
                        {(currentQuestion.tagNames || currentQuestion.tags || []).map((tag, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="text-xs font-normal text-muted-foreground bg-muted/30 whitespace-normal text-left h-auto py-0.5 hover:rotate-3 hover:scale-105 transition-transform duration-200 origin-bottom-left cursor-default"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* 2. 内容瀑布流区域 */}
                <div className="flex-1 min-h-0 bg-muted/30 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-50 bg-background/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-sm">题目加载中...</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            {/* key={currentQuestion.id} 强制 React 在题目切换时重新渲染整个内容区域，
                                解决"切换下一题但内容未刷新"的问题，并重置图片加载状态 */}
                            <div key={currentQuestion.id} className={cn(
                                "p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 mx-auto pb-20 animate-in fade-in duration-300 transition-all ease-in-out",
                                isFullscreen ? "max-w-[1600px]" : "max-w-4xl"
                            )}>


                                {/* 移动端标签显示 (桌面端在顶部) */}
                                <div className="sm:hidden flex flex-wrap gap-1.5 px-0.5 mb-1 opacity-80">
                                    {(currentQuestion.tagNames || currentQuestion.tags || []).map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-muted text-muted-foreground border-0 hover:rotate-3 hover:scale-105 transition-transform duration-200 origin-bottom-left cursor-default">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                {/* 题目区域 */}
                                {visibleViews.has('question') && (
                                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                                        <div className="bg-muted/50 border-b px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                                            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 题目描述
                                        </div>
                                        <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                                            {currentQuestion.contentMd ? (
                                                <div className="w-full p-2">
                                                    <MarkdownContent content={currentQuestion.contentMd} />
                                                </div>
                                            ) : (currentQuestion.contentImg || currentQuestion.imageUrl) ? (
                                                <RemoteImage
                                                    src={currentQuestion.contentImg || currentQuestion.imageUrl || ''}
                                                    alt="题目"
                                                    question={currentQuestion}
                                                />
                                            ) : (
                                                <div className="text-muted-foreground text-sm">题目内容缺失</div>
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
                                                title="视频讲解"
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
                                                            <span>视频将从 {formatTimestamp(timestamp)} 开始</span>
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
                                                    <span className="sm:hidden">去 B 站观看 (空降)</span>
                                                    <span className="hidden sm:inline">在 Bilibili 打开 (支持自动空降)</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 答案区域 */}
                                {visibleViews.has('answer') && (
                                    <div className="bg-card rounded-xl border border-green-100 dark:border-green-900 shadow-sm overflow-hidden">
                                        <div className="bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 px-4 py-2 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                            <Eye className="w-4 h-4" /> 参考答案
                                        </div>
                                        <div className="p-4 sm:p-6 flex justify-center">
                                            {currentQuestion.answerMd ? (
                                                <div className="w-full text-left">
                                                    <MarkdownContent content={currentQuestion.answerMd} />
                                                </div>
                                            ) : currentQuestion.answerImg ? (
                                                <RemoteImage
                                                    src={currentQuestion.answerImg}
                                                    alt="答案"
                                                    question={currentQuestion}
                                                />
                                            ) : currentQuestion.answer ? (
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 py-4">
                                                    {currentQuestion.answer}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">暂无答案内容</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 解析区域 */}
                                {visibleViews.has('analysis') && (
                                    <div className="bg-card rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden">
                                        <div className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                            <FileText className="w-4 h-4" /> 详细解析
                                        </div>
                                        <div className="p-4 sm:p-6 flex justify-center">
                                            {currentQuestion.analysisMd ? (
                                                <div className="w-full text-left">
                                                    <MarkdownContent content={currentQuestion.analysisMd} />
                                                </div>
                                            ) : currentQuestion.analysisImg ? (
                                                <RemoteImage
                                                    src={currentQuestion.analysisImg}
                                                    alt="解析"
                                                    question={currentQuestion}
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-sm">暂无解析内容</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 草稿区域 */}
                                {visibleViews.has('draft') && (
                                    <div className="bg-card rounded-xl border border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden flex flex-col h-[500px]">
                                        <div className="bg-purple-50/50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-purple-700 dark:text-purple-400">
                                            <div className="flex items-center gap-2">
                                                <Pencil className="w-4 h-4" /> 手写草稿
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <TooltipProvider delayDuration={300}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={!eraserMode ? "secondary" : "ghost"}
                                                                size="icon"
                                                                className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                                                onClick={() => {
                                                                    setEraserMode(false);
                                                                    canvasRef.current?.eraseMode(false);
                                                                }}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>画笔</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={eraserMode ? "secondary" : "ghost"}
                                                                size="icon"
                                                                className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                                                onClick={() => {
                                                                    setEraserMode(true);
                                                                    canvasRef.current?.eraseMode(true);
                                                                }}
                                                            >
                                                                <Eraser className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>橡皮擦</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <div className="w-px h-5 bg-border mx-1" />

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={onlyPenMode ? "secondary" : "ghost"}
                                                                size="icon"
                                                                onClick={() => setOnlyPenMode(!onlyPenMode)}
                                                                className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                                            >
                                                                <PenLine className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>{onlyPenMode ? "已开启防误触 (仅限手写笔)" : "开启防误触 (仅限手写笔)"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <div className="w-px h-5 bg-border mx-1" />

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                                                onClick={() => {
                                                                    canvasRef.current?.undo();
                                                                    setTimeout(saveDraft, 100);
                                                                }}
                                                            >
                                                                <Undo className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>撤销</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90 hover:scale-105"
                                                                onClick={() => {
                                                                    if (confirm('确定要清空草稿吗？')) {
                                                                        canvasRef.current?.clearCanvas();
                                                                        setTimeout(saveDraft, 100);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>清空草稿</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <div className="w-px h-5 bg-border mx-1" />

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={useGpu ? "secondary" : "ghost"}
                                                                size="sm"
                                                                className="h-9 px-2 text-xs font-bold transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                                                onClick={() => setUseGpu(!useGpu)}
                                                            >
                                                                GPU
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>{useGpu ? "已开启 GPU 加速 (Beta)" : "开启 GPU 加速 (Beta)"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative bg-white dark:bg-zinc-900 cursor-crosshair touch-none">
                                            {useGpu ? (
                                                <GpuSketchCanvas
                                                    ref={canvasRef}
                                                    strokeWidth={strokeWidth}
                                                    strokeColor={strokeColor}
                                                    canvasColor="transparent"
                                                    className="w-full h-full"
                                                    onStroke={debouncedSaveDraft}
                                                    allowOnlyPointerType={onlyPenMode ? 'pen' : 'all'}
                                                />
                                            ) : (
                                                <ReactSketchCanvas
                                                    ref={canvasRef}
                                                    strokeWidth={strokeWidth}
                                                    strokeColor={strokeColor}
                                                    canvasColor="transparent"
                                                    className="w-full h-full"
                                                    onStroke={debouncedSaveDraft}
                                                    allowOnlyPointerType={onlyPenMode ? 'pen' : 'all'}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 笔记区域 */}
                                {visibleViews.has('note') && (
                                    <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-900 shadow-sm overflow-hidden">
                                        <div className="bg-orange-50/50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                                            <div className="flex items-center gap-2">
                                                <PenLine className="w-4 h-4" /> 个人笔记
                                            </div>
                                            <div className="flex items-center gap-2 text-xs select-none">
                                                <span
                                                    className={cn("cursor-pointer transition-colors", isEditingNote ? "text-muted-foreground" : "font-bold")}
                                                    onClick={() => setIsEditingNote(false)}
                                                >
                                                    预览
                                                </span>
                                                <Switch
                                                    checked={isEditingNote}
                                                    onCheckedChange={setIsEditingNote}
                                                    className="scale-75 data-[state=checked]:bg-orange-500"
                                                />
                                                <span
                                                    className={cn("cursor-pointer transition-colors", isEditingNote ? "font-bold" : "text-muted-foreground")}
                                                    onClick={() => setIsEditingNote(true)}
                                                >
                                                    编辑
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-0">
                                            {isEditingNote ? (
                                                <textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    onBlur={handleNoteBlur}
                                                    placeholder="在此输入 Markdown 笔记... (支持 **加粗**, - 列表, > 引用 等)"
                                                    className="w-full h-64 p-4 resize-y bg-transparent outline-none font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className="p-4 sm:p-6 prose prose-sm dark:prose-invert max-w-none min-h-[100px] cursor-text"
                                                    onClick={() => setIsEditingNote(true)}
                                                >
                                                    {noteContent ? (
                                                        <MarkdownContent content={noteContent} />
                                                    ) : (
                                                        <span className="text-muted-foreground/50 italic select-none">点击此处开始记录笔记...</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </ScrollArea>
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
                                    <span className="hidden sm:inline">上一题</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>快捷键: ←</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* 中间：状态操作按钮 - 移动端紧凑布局 */}
                    <div className="flex justify-center gap-2 sm:gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => question?.id && onUpdateStatus(question.id, 'mastered')}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm">斩</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>快捷键: 1</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => question?.id && onUpdateStatus(question.id, 'confused')}
                                        disabled={isLoading}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm">懵</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>快捷键: 2</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => question?.id && onUpdateStatus(question.id, 'failed')}
                                        disabled={isLoading}
                                        className="bg-red-600 hover:bg-red-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                                    >
                                        <X className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm">崩</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>快捷键: 3</p>
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
                                    <span className="hidden sm:inline">下一题</span>
                                    <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5 sm:ml-1" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>快捷键: →</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                </div>

            </DialogContent>
        </Dialog>
    );
}
