import { useEffect, useCallback, useState, useMemo } from "react";
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
import { getBilibiliEmbed } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Check, X, HelpCircle, BookOpen, Eye, FileText,
    ChevronLeft, ChevronRight, MonitorPlay, PenLine, Star,
    Loader2, ImageOff
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useProgressStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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

type ViewType = 'question' | 'answer' | 'analysis' | 'video' | 'note';

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
const RemoteImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { repoBaseUrl } = useProgressStore.getState();

    const finalSrc = useMemo(() => {
        if (!src) return '';
        if (src.startsWith('http') || src.startsWith('data:')) return src;
        if (repoBaseUrl) {
            const cleanBase = repoBaseUrl.replace(/\/$/, '');
            const cleanPath = src.startsWith('/') ? src : `/${src}`;
            return `${cleanBase}${cleanPath}`;
        }
        return src;
    }, [src, repoBaseUrl]);

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
    const { notes, updateNote, stars, toggleStar } = useProgressStore();
    const [noteContent, setNoteContent] = useState("");
    const [isEditingNote, setIsEditingNote] = useState(false);

    const isStarred = question ? !!stars[question.id] : false;

    // 初始化笔记内容
    useEffect(() => {
        if (question) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNoteContent(notes[question.id] || "");
        }
    }, [question, notes]);

    // 自动保存笔记
    const handleNoteBlur = () => {
        if (question && noteContent !== notes[question.id]) {
            updateNote(question.id, noteContent);
        }
    };

    useEffect(() => {
        if (isOpen && question) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

        const preload = (url?: string) => {
            if (!url) return;
            const img = new Image();
            // 处理远程路径逻辑与 RemoteImage 保持一致
            if (!url.startsWith('http') && !url.startsWith('data:')) {
                const repoBaseUrl = useProgressStore.getState().repoBaseUrl;
                if (repoBaseUrl) {
                    const cleanBase = repoBaseUrl.replace(/\/$/, '');
                    const cleanPath = url.startsWith('/') ? url : `/${url}`;
                    img.src = `${cleanBase}${cleanPath}`;
                    return;
                }
            }
            img.src = url;
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
            <DialogContent className="w-screen h-screen sm:max-w-5xl sm:h-[95vh] flex flex-col p-0 gap-0 outline-none rounded-none sm:rounded-xl overflow-hidden">
                <DialogTitle className="sr-only">{`第 ${currentQuestion.number} 题`}</DialogTitle>

                {/* 1. 头部信息与工具栏 */}
                <div className="px-4 sm:px-6 py-3 border-b bg-background flex items-center justify-between z-20 shadow-sm shrink-0 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <div className="flex flex-col shrink-0">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                <span className="sm:hidden">#{currentQuestion.number}</span>
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
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{currentQuestion.type}</span>
                        </div>

                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                            {videoEmbedUrl && (
                                <Toggle
                                    size="sm"
                                    pressed={visibleViews.has('video')}
                                    onPressedChange={() => toggleView('video')}
                                    className="h-7 w-7 sm:w-auto sm:px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                                    aria-label="Toggle video"
                                >
                                    <MonitorPlay className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline text-xs">视频</span>
                                </Toggle>
                            )}
                            <Toggle
                                size="sm"
                                pressed={visibleViews.has('answer')}
                                onPressedChange={() => toggleView('answer')}
                                className="h-7 w-7 sm:w-auto sm:px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                                aria-label="Toggle answer"
                            >
                                <Eye className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline text-xs">答案</span>
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={visibleViews.has('analysis')}
                                onPressedChange={() => toggleView('analysis')}
                                className="h-7 w-7 sm:w-auto sm:px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                                aria-label="Toggle analysis"
                            >
                                <FileText className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline text-xs">解析</span>
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={visibleViews.has('note')}
                                onPressedChange={() => toggleView('note')}
                                className="h-7 w-7 sm:w-auto sm:px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                                aria-label="Toggle note"
                            >
                                <PenLine className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline text-xs">笔记</span>
                            </Toggle>
                        </div>
                    </div>
                    {/* 标签 (桌面端显示) */}
                    <div className="hidden sm:flex items-center gap-2 flex-wrap">
                        {(currentQuestion.tagNames || currentQuestion.tags || []).map((tag, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="text-xs font-normal text-muted-foreground bg-muted/30 whitespace-normal text-left h-auto py-0.5"
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
                            <div key={currentQuestion.id} className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">

                                {/* 题目区域 */}
                                {visibleViews.has('question') && (
                                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                                        <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <BookOpen className="w-4 h-4" /> 题目描述
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
                                                />
                                            ) : (
                                                <div className="text-muted-foreground text-sm">题目内容缺失</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 视频区域 */}
                                {visibleViews.has('video') && videoEmbedUrl && (
                                    <div className="bg-black rounded-xl border shadow-sm overflow-hidden aspect-video ring-2 ring-blue-100">
                                        <iframe
                                            src={videoEmbedUrl}
                                            className="w-full h-full"
                                            scrolling="no"
                                            frameBorder="0"
                                            allowFullScreen
                                            allow="autoplay; encrypted-media"
                                            title="视频讲解"
                                        />
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
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-sm">暂无解析内容</span>
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
                <div className="p-3 sm:p-4 border-t bg-background grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">

                    {/* 左侧：上一题 - 移动端仅图标 */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={onPrev}
                                    disabled={!hasPrev || isLoading}
                                    size="icon"
                                    className="sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-5 h-5 sm:mr-1" />
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
                                        onClick={() => currentQuestion.id && onUpdateStatus(currentQuestion.id, 'mastered')}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95"
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
                                        onClick={() => currentQuestion.id && onUpdateStatus(currentQuestion.id, 'confused')}
                                        disabled={isLoading}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95"
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
                                        onClick={() => currentQuestion.id && onUpdateStatus(currentQuestion.id, 'failed')}
                                        disabled={isLoading}
                                        className="bg-red-600 hover:bg-red-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95"
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
                                    className="sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <span className="hidden sm:inline">下一题</span>
                                    <ChevronRight className="w-5 h-5 sm:ml-1" />
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
