"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Save, Loader2, Plus, Tag } from "lucide-react";
import { Question } from "@/lib/types";
import { DICT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/question";

interface QuestionEditPanelProps {
    question: Question;
    onSave: (updatedQuestion: Partial<Question>) => Promise<void>;
    onCancel: () => void;
    className?: string;
}

type QuestionType = 'choice' | 'fill' | 'answer';

export function QuestionEditPanel({
    question,
    onSave,
    onCancel,
    className
}: QuestionEditPanelProps) {
    // 编辑状态
    const [answer, setAnswer] = useState(question.answer || "");
    const [answerMd, setAnswerMd] = useState(question.answerMd || "");
    const [analysisMd, setAnalysisMd] = useState(question.analysisMd || "");
    const [contentMd, setContentMd] = useState(question.contentMd || "");
    const [type, setType] = useState<QuestionType>(question.type as QuestionType || "choice");
    const [tags, setTags] = useState<string[]>(question.tags || []);
    const [newTag, setNewTag] = useState("");

    // UI 状态
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'answer' | 'analysis'>('content');
    const [hasChanges, setHasChanges] = useState(false);

    // 检测变更
    useEffect(() => {
        const changed =
            answer !== (question.answer || "") ||
            answerMd !== (question.answerMd || "") ||
            analysisMd !== (question.analysisMd || "") ||
            contentMd !== (question.contentMd || "") ||
            type !== (question.type || "choice") ||
            JSON.stringify(tags) !== JSON.stringify(question.tags || []);
        setHasChanges(changed);
    }, [answer, answerMd, analysisMd, contentMd, type, tags, question]);

    // 保存处理
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            await onSave({
                answer,
                answerMd: answerMd || undefined,
                analysisMd: analysisMd || undefined,
                contentMd: contentMd || undefined,
                type,
                tags
            });
        } finally {
            setIsSaving(false);
        }
    }, [answer, answerMd, analysisMd, contentMd, type, tags, onSave]);

    // 标签管理
    const addTag = useCallback(() => {
        const trimmed = newTag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setNewTag("");
        }
    }, [newTag, tags]);

    const removeTag = useCallback((tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    }, [tags]);

    return (
        <div className={cn("flex flex-col h-full bg-card border-l", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{DICT.manage.editQuestion}</span>
                    {hasChanges && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            {DICT.common.unsaved}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        {DICT.common.cancel}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="gap-1"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {DICT.common.save}
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* 题型选择 */}
                    <div className="space-y-2">
                        <Label>{DICT.editor.type}</Label>
                        <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="choice">{DICT.editor.choiceType}</SelectItem>
                                <SelectItem value="fill">{DICT.wall.fill}</SelectItem>
                                <SelectItem value="answer">{DICT.wall.answer}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 简答 (选择题答案) */}
                    <div className="space-y-2">
                        <Label>{DICT.editor.answerShort}</Label>
                        <Input
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder={DICT.editor.answerPlaceholder}
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            {DICT.editor.answerPlaceholder}
                        </p>
                    </div>

                    {/* 标签管理 */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {DICT.practice.tags}
                        </Label>
                        <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md bg-muted/20">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="gap-1 pr-1"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                            {tags.length === 0 && (
                                <span className="text-xs text-muted-foreground">{DICT.practice.noTagsAvailable}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder={DICT.editor.addTag}
                                className="flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={addTag}
                                disabled={!newTag.trim()}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* 答案/解析/内容 Markdown 编辑 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={cn(
                                    "text-sm font-medium px-3 py-1 rounded-md transition-colors whitespace-nowrap",
                                    activeTab === 'content'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {DICT.exam.questionDesc}
                            </button>
                            <button
                                onClick={() => setActiveTab('answer')}
                                className={cn(
                                    "text-sm font-medium px-3 py-1 rounded-md transition-colors whitespace-nowrap",
                                    activeTab === 'answer'
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {DICT.exam.answer}
                            </button>
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={cn(
                                    "text-sm font-medium px-3 py-1 rounded-md transition-colors whitespace-nowrap",
                                    activeTab === 'analysis'
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {DICT.exam.analysis}
                            </button>
                        </div>

                        {activeTab === 'content' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                <Textarea
                                    value={contentMd}
                                    onChange={(e) => setContentMd(e.target.value)}
                                    placeholder={DICT.editor.contentPlaceholder}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                                {contentMd && (
                                    <div className="p-3 border rounded-md bg-muted/10">
                                        <p className="text-xs text-muted-foreground mb-2">{DICT.editor.questionPreview}</p>
                                        <MarkdownContent content={contentMd} />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'answer' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                <Textarea
                                    value={answerMd}
                                    onChange={(e) => setAnswerMd(e.target.value)}
                                    placeholder={DICT.editor.answerDetailPlaceholder}
                                    className="min-h-[150px] font-mono text-sm"
                                />
                                {answerMd && (
                                    <div className="p-3 border rounded-md bg-muted/10">
                                        <p className="text-xs text-muted-foreground mb-2">{DICT.editor.questionPreview}</p>
                                        <MarkdownContent content={answerMd} />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'analysis' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                <Textarea
                                    value={analysisMd}
                                    onChange={(e) => setAnalysisMd(e.target.value)}
                                    placeholder={DICT.editor.analysisPlaceholder}
                                    className="min-h-[150px] font-mono text-sm"
                                />
                                {analysisMd && (
                                    <div className="p-3 border rounded-md bg-muted/10">
                                        <p className="text-xs text-muted-foreground mb-2">{DICT.editor.analysisPreview}</p>
                                        <MarkdownContent content={analysisMd} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
