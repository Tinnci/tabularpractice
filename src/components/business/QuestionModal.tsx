"use client";

import { useEffect, useCallback, useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Question, Status } from "@/lib/types";
import { getBilibiliEmbed } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Check, X, HelpCircle, PlayCircle, BookOpen, Eye, FileText,
    ChevronLeft, ChevronRight, MonitorPlay
} from "lucide-react";

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

type ViewType = 'question' | 'answer' | 'analysis' | 'video';

export function QuestionModal({
    isOpen, onClose, question, onUpdateStatus,
    onPrev, onNext, hasPrev, hasNext
}: Props) {

    // 管理可见区域的状态 (允许多选)
    const [visibleViews, setVisibleViews] = useState<Set<ViewType>>(new Set(['question']));

    // 当题目切换时，重置视图状态 (防止下一题直接剧透答案)
    useEffect(() => {
        if (isOpen && question) {
            setVisibleViews(new Set(['question']));
        }
    }, [question?.id, isOpen]);

    // 键盘快捷键监听
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        // 避免输入框干扰
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case "ArrowLeft":
                // 只有当没有按下修饰键时才触发
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

    // 切换视图显示的辅助函数
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
            <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0 outline-none">

                {/* 1. 头部信息与工具栏 */}
                <div className="px-6 py-3 border-b bg-white flex items-center justify-between z-20 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">第 {question.number} 题</span>
                            <span className="text-xs text-slate-500">类型: {question.type}</span>
                        </div>

                        {/* 视图切换开关组 - 核心 UX 改进 */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border">
                            <Toggle
                                pressed={visibleViews.has('question')}
                                onPressedChange={() => toggleView('question')}
                                aria-label="显示题目"
                                className="data-[state=on]:bg-white data-[state=on]:shadow-sm h-8 px-3 text-xs gap-2"
                            >
                                <BookOpen className="w-3.5 h-3.5" /> 题目
                            </Toggle>

                            {videoEmbedUrl && (
                                <Toggle
                                    pressed={visibleViews.has('video')}
                                    onPressedChange={() => toggleView('video')}
                                    aria-label="显示视频"
                                    className="data-[state=on]:bg-white data-[state=on]:shadow-sm h-8 px-3 text-xs gap-2 text-blue-600 data-[state=on]:text-blue-700"
                                >
                                    <MonitorPlay className="w-3.5 h-3.5" /> 视频
                                </Toggle>
                            )}

                            <div className="w-px h-4 bg-slate-300 mx-1" />

                            <Toggle
                                pressed={visibleViews.has('answer')}
                                onPressedChange={() => toggleView('answer')}
                                aria-label="显示答案"
                                className="data-[state=on]:bg-white data-[state=on]:shadow-sm h-8 px-3 text-xs gap-2"
                            >
                                <Eye className="w-3.5 h-3.5" /> 答案
                            </Toggle>
                            <Toggle
                                pressed={visibleViews.has('analysis')}
                                onPressedChange={() => toggleView('analysis')}
                                aria-label="显示解析"
                                className="data-[state=on]:bg-white data-[state=on]:shadow-sm h-8 px-3 text-xs gap-2"
                            >
                                <FileText className="w-3.5 h-3.5" /> 解析
                            </Toggle>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {question.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs text-slate-500 font-normal">
                                {tag}
                            </Badge>
                        ))}
                        {question.tags && question.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs text-slate-400">
                                +{question.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* 2. 内容瀑布流区域 */}
                <div className="flex-1 min-h-0 bg-slate-50/50 relative">
                    <ScrollArea className="h-full">
                        <div className="p-6 flex flex-col gap-6 max-w-4xl mx-auto pb-20">

                            {/* 题目区域 */}
                            {visibleViews.has('question') && (
                                <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-slate-50/80 border-b px-4 py-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <BookOpen className="w-4 h-4" /> 题目描述
                                    </div>
                                    <div className="p-6 flex justify-center">
                                        {question.contentImg || question.imageUrl ? (
                                            <img
                                                src={question.contentImg || question.imageUrl}
                                                alt="题目"
                                                className="max-w-full h-auto object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="h-64 w-full bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                                题目图片占位符
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 视频区域 */}
                            {visibleViews.has('video') && videoEmbedUrl && (
                                <div className="bg-black rounded-xl border shadow-sm overflow-hidden aspect-video animate-in fade-in slide-in-from-bottom-2 duration-300 ring-2 ring-blue-200">
                                    <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                                        <MonitorPlay className="w-4 h-4" /> 视频讲解
                                    </div>
                                    <div className="aspect-video bg-black">
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
                                </div>
                            )}

                            {/* 答案区域 */}
                            {visibleViews.has('answer') && (
                                <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-green-50/50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-sm font-medium text-green-700">
                                        <Eye className="w-4 h-4" /> 参考答案
                                    </div>
                                    <div className="p-6 flex justify-center">
                                        {question.answerImg ? (
                                            <img
                                                src={question.answerImg}
                                                alt="答案"
                                                className="max-w-full h-auto object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center space-y-2 py-8">
                                                <span className="text-slate-400 text-sm">暂无答案图片</span>
                                                <p className="text-xs text-slate-400">可以在 questions.json 中添加 answerImg 字段</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 解析区域 */}
                            {visibleViews.has('analysis') && (
                                <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-blue-50/50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                                        <FileText className="w-4 h-4" /> 详细解析
                                    </div>
                                    <div className="p-6 flex justify-center">
                                        {question.analysisImg ? (
                                            <img
                                                src={question.analysisImg}
                                                alt="解析"
                                                className="max-w-full h-auto object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center space-y-2 py-8">
                                                <span className="text-slate-400 text-sm">暂无解析图片</span>
                                                <p className="text-xs text-slate-400">可以在 questions.json 中添加 analysisImg 字段</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </div>

                {/* 3. 底部操作栏 */}
                <div className="p-4 border-t bg-white grid grid-cols-[1fr_auto_1fr] items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">

                    {/* 左侧：上一题 */}
                    <div className="flex justify-start">
                        <Button
                            variant="ghost"
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="gap-2 pl-2 pr-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-all"
                            title="快捷键: ← (左方向键)"
                        >
                            <ChevronLeft className="w-5 h-5" /> 上一题
                        </Button>
                    </div>

                    {/* 中间：状态操作按钮 */}
                    <div className="flex justify-center gap-3">
                        <Button
                            onClick={() => onUpdateStatus(question.id, 'mastered')}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2 w-28 shadow-sm transition-all active:scale-95"
                            title="快捷键: 1"
                        >
                            <Check className="w-4 h-4" /> 斩
                        </Button>

                        <Button
                            onClick={() => onUpdateStatus(question.id, 'confused')}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2 w-28 shadow-sm transition-all active:scale-95"
                            title="快捷键: 2"
                        >
                            <HelpCircle className="w-4 h-4" /> 懵
                        </Button>

                        <Button
                            onClick={() => onUpdateStatus(question.id, 'failed')}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2 w-28 shadow-sm transition-all active:scale-95"
                            title="快捷键: 3"
                        >
                            <X className="w-4 h-4" /> 崩
                        </Button>
                    </div>

                    {/* 右侧：下一题 */}
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            onClick={onNext}
                            disabled={!hasNext}
                            className="gap-2 pl-4 pr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-all"
                            title="快捷键: → (右方向键)"
                        >
                            下一题 <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                </div>

            </DialogContent>
        </Dialog>
    );
}
