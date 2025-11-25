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
    ChevronLeft, ChevronRight, MonitorPlay, PenLine
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
    const { notes, updateNote } = useProgressStore();
    const [noteContent, setNoteContent] = useState("");
    const [isEditingNote, setIsEditingNote] = useState(false);

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
                            <span className="text-sm font-bold text-foreground">
                                <span className="sm:hidden">#{question.number}</span>
                                <span className="hidden sm:inline">第 {question.number} 题</span>
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{question.type}</span>
                        </div>

                        {/* 响应式开关组
               - 移动端: 仅图标 (px-2)
               - 桌面端: 图标 + 文字 (px-3 gap-2)
            */}
                        <div className="flex items-center bg-muted p-1 rounded-lg border shrink-0">
                            <Toggle
                                pressed={visibleViews.has('question')}
                                onPressedChange={() => toggleView('question')}
                                aria-label="显示题目"
                                className="data-[state=on]:bg-background data-[state=on]:shadow-sm h-7 sm:h-8 px-2 sm:px-3 text-xs gap-2"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">题目</span>
                            </Toggle>

                            {videoEmbedUrl && (
                                <Toggle
                                    pressed={visibleViews.has('video')}
                                    onPressedChange={() => toggleView('video')}
                                    className="data-[state=on]:bg-background data-[state=on]:shadow-sm h-7 sm:h-8 px-2 sm:px-3 text-xs gap-2 text-primary data-[state=on]:text-primary"
                                >
                                    <MonitorPlay className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">视频</span>
                                </Toggle>
                            )}

                            <div className="w-px h-3 sm:h-4 bg-border mx-1" />

                            <Toggle
                                pressed={visibleViews.has('answer')}
                                onPressedChange={() => toggleView('answer')}
                                className="data-[state=on]:bg-background data-[state=on]:shadow-sm h-7 sm:h-8 px-2 sm:px-3 text-xs gap-2"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">答案</span>
                            </Toggle>
                            <Toggle
                                pressed={visibleViews.has('analysis')}
                                onPressedChange={() => toggleView('analysis')}
                                className="data-[state=on]:bg-background data-[state=on]:shadow-sm h-7 sm:h-8 px-2 sm:px-3 text-xs gap-2"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">解析</span>
                            </Toggle>

                            <div className="w-px h-3 sm:h-4 bg-border mx-1" />

                            <Toggle
                                pressed={visibleViews.has('note')}
                                onPressedChange={() => toggleView('note')}
                                className="data-[state=on]:bg-background data-[state=on]:shadow-sm h-7 sm:h-8 px-2 sm:px-3 text-xs gap-2 text-orange-600 data-[state=on]:text-orange-600"
                            >
                                <PenLine className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">笔记</span>
                            </Toggle>
                        </div>
                    </div>

                    {/* 移动端隐藏标签，避免挤压 */}
                    <div className="hidden sm:flex gap-2">
                        {question.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs text-muted-foreground font-normal">
                                {tag}
                            </Badge>
                        ))}
                        {question.tags && question.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{question.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* 2. 内容瀑布流区域 */}
                <div className="flex-1 min-h-0 bg-muted/30 relative">
                    <ScrollArea className="h-full">
                        <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl mx-auto pb-20">

                            {/* 题目区域 */}
                            {visibleViews.has('question') && (
                                <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <BookOpen className="w-4 h-4" /> 题目描述
                                        {/* 移动端在这里补充 Tag 显示 */}
                                        <div className="flex sm:hidden gap-1 ml-auto">
                                            {question.tags?.slice(0, 1).map(tag => (
                                                <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 flex justify-center bg-card min-h-[150px] items-center">
                                        {question.contentMd ? (
                                            <div className="w-full p-2">
                                                <MarkdownContent content={question.contentMd} />
                                            </div>
                                        ) : (question.contentImg || question.imageUrl) ? (
                                            <img
                                                src={question.contentImg || question.imageUrl}
                                                alt="题目"
                                                className="max-w-full h-auto object-contain"
                                            />
                                        ) : (
                                            <div className="text-muted-foreground text-sm">题目内容缺失</div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                                src={question.answerImg}
                                                alt="答案"
                                                className="max-w-full h-auto object-contain"
                                            />
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
                                                src={question.analysisImg}
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
