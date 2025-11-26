"use client";

import { useEffect, useCallback, useState } from "react";
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
    ChevronLeft, ChevronRight, MonitorPlay, PenLine, Star
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

export function QuestionModal({
    isOpen, onClose, question, onUpdateStatus,
    onPrev, onNext, hasPrev, hasNext
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
            setVisibleViews(new Set(['question']));
        }
    }, [question?.id, isOpen]);

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

    if (!question) return null;

    const videoEmbedUrl = question.videoUrl ? getBilibiliEmbed(question.videoUrl) : null;

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
            {/* 响应式 Dialog 尺寸
        - 移动端: w-screen h-screen rounded-none (全屏)
        - 桌面端: sm:max-w-5xl sm:h-[95vh] sm:rounded-xl (悬浮大窗)
      */}
            <DialogContent className="w-screen h-screen sm:max-w-5xl sm:h-[95vh] flex flex-col p-0 gap-0 outline-none rounded-none sm:rounded-xl overflow-hidden">
                {/* Accessibility: provide a DialogTitle for screen readers (hidden visually) */}
                <DialogTitle className="sr-only">{`第 ${question.number} 题 · ${question.type}`}</DialogTitle>

                {/* 1. 头部信息与工具栏 */}
                <div className="px-4 sm:px-6 py-3 border-b bg-background flex items-center justify-between z-20 shadow-sm shrink-0 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <div className="flex flex-col shrink-0">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                <span className="sm:hidden">#{question.number}</span>
                                <span className="hidden sm:inline">第 {question.number} 题</span>
                                {/* 收藏按钮 */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-yellow-500"
                                    onClick={() => toggleStar(question.id)}
                                    title={isStarred ? "取消收藏" : "收藏题目"}
                                >
                                    <Star className={cn("w-4 h-4", isStarred && "fill-yellow-500 text-yellow-500")} />
                                </Button>
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{question.type}</span>
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
                        {(question.tagNames || question.tags).map((tag, index) => (
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
                    <ScrollArea className="h-full">
                        <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl mx-auto pb-20">

                            {/* 题目区域 */}
                            {visibleViews.has('question') && (
                                <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* ... (keep existing header) */}
                                    <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <BookOpen className="w-4 h-4" /> 题目描述
                                        {/* ... (keep existing mobile tags) */}
                                    </div>
                                    <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                                        {question.contentMd ? (
                                            <div className="w-full p-2">
                                                <MarkdownContent content={question.contentMd} />
                                            </div>
                                        ) : (question.contentImg || question.imageUrl) ? (
                                            <img
                                                src={(() => {
                                                    const imgUrl = question.contentImg || question.imageUrl;
                                                    if (!imgUrl) return '';
                                                    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
                                                    // 如果配置了远程题库，且图片是相对路径，则拼接远程地址
                                                    const { repoBaseUrl } = useProgressStore.getState();
                                                    console.log('[ImageDebug] Original:', imgUrl, 'RepoBase:', repoBaseUrl);
                                                    if (repoBaseUrl) {
                                                        const cleanBase = repoBaseUrl.replace(/\/$/, '');
                                                        const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
                                                        const finalUrl = `${cleanBase}${cleanPath}`;
                                                        console.log('[ImageDebug] Resolved:', finalUrl);
                                                        return finalUrl;
                                                    }
                                                    return imgUrl;
                                                })()}
                                                alt="题目"
                                                className="max-w-full h-auto object-contain dark:invert dark:hue-rotate-180 transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="text-muted-foreground text-sm">题目内容缺失</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ... (other sections will be handled in subsequent edits if needed, but for now focusing on Question Image) */}

                            {/* 视频区域 */}
                            {visibleViews.has('video') && videoEmbedUrl && (
                                <div className="bg-black rounded-xl border shadow-sm overflow-hidden aspect-video animate-in fade-in slide-in-from-bottom-2 duration-300 ring-2 ring-blue-100">
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
                                <div className="bg-card rounded-xl border border-green-100 dark:border-green-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 px-4 py-2 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                        <Eye className="w-4 h-4" /> 参考答案
                                    </div>
                                    <div className="p-4 sm:p-6 flex justify-center">
                                        {question.answerMd ? (
                                            <div className="w-full text-left">
                                                <MarkdownContent content={question.answerMd} />
                                            </div>
                                        ) : question.answerImg ? (
                                            <img
                                                src={(() => {
                                                    const imgUrl = question.answerImg;
                                                    if (!imgUrl) return '';
                                                    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
                                                    const { repoBaseUrl } = useProgressStore.getState();
                                                    if (repoBaseUrl) {
                                                        const cleanBase = repoBaseUrl.replace(/\/$/, '');
                                                        const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
                                                        return `${cleanBase}${cleanPath}`;
                                                    }
                                                    return imgUrl;
                                                })()}
                                                alt="答案"
                                                className="max-w-full h-auto object-contain"
                                            />
                                        ) : question.answer ? (
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 py-4">
                                                {question.answer}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">暂无答案内容</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 解析区域 */}
                            {visibleViews.has('analysis') && (
                                <div className="bg-card rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                        <FileText className="w-4 h-4" /> 详细解析
                                    </div>
                                    <div className="p-4 sm:p-6 flex justify-center">
                                        {question.analysisMd ? (
                                            <div className="w-full text-left">
                                                <MarkdownContent content={question.analysisMd} />
                                            </div>
                                        ) : question.analysisImg ? (
                                            <img
                                                src={(() => {
                                                    const imgUrl = question.analysisImg;
                                                    if (!imgUrl) return '';
                                                    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
                                                    const { repoBaseUrl } = useProgressStore.getState();
                                                    console.log('[AnalysisDebug] Original:', imgUrl, 'RepoBase:', repoBaseUrl);
                                                    if (repoBaseUrl) {
                                                        const cleanBase = repoBaseUrl.replace(/\/$/, '');
                                                        const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
                                                        const finalUrl = `${cleanBase}${cleanPath}`;
                                                        console.log('[AnalysisDebug] Resolved:', finalUrl);
                                                        return finalUrl;
                                                    }
                                                    return imgUrl;
                                                })()}
                                                alt="解析"
                                                className="max-w-full h-auto object-contain"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">暂无解析内容</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 笔记区域 */}
                            {visibleViews.has('note') && (
                                <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                    disabled={!hasPrev}
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
                                        onClick={() => onUpdateStatus(question.id, 'mastered')}
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
                                        onClick={() => onUpdateStatus(question.id, 'confused')}
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
                                        onClick={() => onUpdateStatus(question.id, 'failed')}
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
                                    disabled={!hasNext}
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
