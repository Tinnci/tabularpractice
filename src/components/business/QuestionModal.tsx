"use client";

import { useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Question, Status } from "@/lib/types";
import { getBilibiliEmbed } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, X, HelpCircle, PlayCircle, BookOpen, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    onUpdateStatus: (id: string, status: Status) => void;
    // 新增导航 Props
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

export function QuestionModal({
    isOpen,
    onClose,
    question,
    onUpdateStatus,
    onPrev,
    onNext,
    hasPrev,
    hasNext
}: Props) {

    // 键盘快捷键监听
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        // 如果焦点在输入框内，不触发快捷键（为未来的笔记功能预留）
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case "ArrowLeft":
                if (hasPrev) {
                    e.preventDefault();
                    onPrev();
                }
                break;
            case "ArrowRight":
                if (hasNext) {
                    e.preventDefault();
                    onNext();
                }
                break;
            case "Escape":
                onClose();
                break;
            // 可选：数字键快速标记
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
    const questionImg = question.contentImg || question.imageUrl; // 向后兼容

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* max-w-4xl 宽度加大，方便看视频和宽图 */}
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 outline-none">

                {/* 1. 头部信息 */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base px-3 py-1 bg-white font-mono">
                            第 {question.number} 题
                        </Badge>
                        {/* Tag 显示 */}
                        {question.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs text-slate-500">
                                {tag}
                            </Badge>
                        ))}
                        {question.tags && question.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs text-slate-400">
                                +{question.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* 2. 核心内容区 (Tabs) */}
                <div className="flex-1 overflow-hidden bg-slate-50/30">
                    <Tabs defaultValue="question" className="h-full flex flex-col">

                        {/* Tabs 导航栏 */}
                        <div className="px-6 border-b bg-white">
                            <TabsList className="h-12">
                                <TabsTrigger value="question" className="text-sm gap-2">
                                    <BookOpen className="w-4 h-4" /> 题目
                                </TabsTrigger>
                                <TabsTrigger value="answer" className="text-sm gap-2">
                                    <Eye className="w-4 h-4" /> 答案
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="text-sm gap-2">
                                    <FileText className="w-4 h-4" /> 解析
                                </TabsTrigger>
                                {videoEmbedUrl && (
                                    <TabsTrigger value="video" className="text-sm gap-2">
                                        <PlayCircle className="w-4 h-4" /> 视频讲解
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto bg-white">

                            {/* Tab: 题目 */}
                            <TabsContent value="question" className="mt-0 h-full flex items-center justify-center min-h-[400px] p-6">
                                <div className="w-full max-w-2xl">
                                    {questionImg ? (
                                        <img
                                            src={questionImg}
                                            alt="题目"
                                            className="w-full h-auto rounded-lg border shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                            题目图片占位符
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Tab: 答案 (纯结果) */}
                            <TabsContent value="answer" className="mt-0 h-full flex items-center justify-center p-6">
                                {question.answerImg ? (
                                    <img
                                        src={question.answerImg}
                                        alt="答案"
                                        className="max-w-full max-h-full object-contain rounded-lg border shadow-sm"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="text-slate-400 text-lg">暂无答案图片</div>
                                        <p className="text-xs text-slate-400">可以在 questions.json 中添加 answerImg 字段</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab: 解析 (详细过程) */}
                            <TabsContent value="analysis" className="mt-0 h-full flex items-center justify-center p-6">
                                {question.analysisImg ? (
                                    <img
                                        src={question.analysisImg}
                                        alt="解析"
                                        className="max-w-full max-h-full object-contain rounded-lg border shadow-sm"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="text-slate-400 text-lg">暂无解析图片</div>
                                        <p className="text-xs text-slate-400">可以在 questions.json 中添加 analysisImg 字段</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab: 视频 */}
                            {videoEmbedUrl && (
                                <TabsContent value="video" className="mt-0 h-full bg-black p-0">
                                    <iframe
                                        src={videoEmbedUrl}
                                        className="w-full h-full"
                                        scrolling="no"
                                        frameBorder="0"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media"
                                        title="视频讲解"
                                    />
                                </TabsContent>
                            )}

                        </div>
                    </Tabs>
                </div>

                {/* 3. 底部操作栏 - 全新三栏布局 */}
                <div className="p-4 border-t bg-white grid grid-cols-[1fr_auto_1fr] items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">

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
