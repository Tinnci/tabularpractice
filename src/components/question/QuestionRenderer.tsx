"use client";

import { cn } from "@/lib/utils";
import { Question } from "@/lib/types";
import { MarkdownContent } from "./ui/MarkdownContent";
import { RemoteImage } from "./ui/RemoteImage";

// Re-export specific UI components for convenience if needed, 
// though direct import from ./ui/* is preferred for tree-shaking usually.
export { MarkdownContent } from "./ui/MarkdownContent";
export { RemoteImage } from "./ui/RemoteImage";


// 题目内容渲染器 - 统一处理 Markdown 和图片的显示逻辑
export interface QuestionContentRendererProps {
    contentMd?: string | null;
    contentImg?: string | null;
    question?: Question | null;
    fallbackText?: string;
    className?: string;
}

export function QuestionContentRenderer({
    contentMd,
    contentImg,
    question,
    fallbackText,
    className
}: QuestionContentRendererProps) {
    if (contentMd) {
        return (
            <div className={cn("w-full text-left", className)}>
                <MarkdownContent content={contentMd} />
            </div>
        );
    }

    if (contentImg) {
        return (
            <RemoteImage
                src={contentImg}
                alt="content"
                question={question}
                className={className}
            />
        );
    }

    if (fallbackText) {
        return (
            <span className="text-muted-foreground text-sm">{fallbackText}</span>
        );
    }

    return null;
}

