"use client";

import { useState, useEffect } from "react";
import { PenLine } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DICT } from "@/lib/i18n";
import { MarkdownContent } from "@/components/question";

interface NotePanelProps {
    questionId: string;
    initialContent: string;
    onUpdateNote: (id: string, content: string) => void;
    isVisible: boolean;
}

export function NotePanel({ questionId, initialContent, onUpdateNote, isVisible }: NotePanelProps) {
    const [noteContent, setNoteContent] = useState(initialContent || "");
    const [isEditingNote, setIsEditingNote] = useState(false);

    // Sync local state when prop changes (switching questions)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNoteContent(initialContent || "");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditingNote(false); // Reset editing state on question switch
    }, [initialContent, questionId]);

    const handleBlur = () => {
        if (noteContent !== initialContent) {
            onUpdateNote(questionId, noteContent);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-900 shadow-sm overflow-hidden">
            <div className="bg-orange-50/50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4" /> {DICT.exam.personalNote}
                </div>
                <div className="flex items-center gap-2 text-xs select-none">
                    <span
                        className={cn("cursor-pointer transition-colors", isEditingNote ? "text-muted-foreground" : "font-bold")}
                        onClick={() => setIsEditingNote(false)}
                    >
                        {DICT.common.preview}
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
                        {DICT.common.edit}
                    </span>
                </div>
            </div>
            <div className="p-0">
                {isEditingNote ? (
                    <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        onBlur={handleBlur}
                        placeholder={DICT.exam.notePlaceholder}
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
                            <span className="text-muted-foreground/50 italic select-none">{DICT.exam.startNotePrompt}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
