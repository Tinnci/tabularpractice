"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Loader2, ImageOff } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import { Question } from "@/lib/types";
import { DICT } from "@/lib/i18n";

// 智能格式化内容：自动检测并包装 LaTeX
export const smartFormatContent = (content: string) => {
    if (!content) return "";
    const trimmed = content.trim();

    // 如果已经被 $$ 包裹，不重复处理
    if (trimmed.startsWith('$$') || trimmed.startsWith('$')) {
        return content;
    }

    // 检测是否包含 LaTeX 环境（如 \begin{cases}, \begin{matrix}, \begin{pmatrix} 等）
    // 这类内容需要用 $$ 包裹才能被 remark-math 识别
    if (trimmed.includes('\\begin{')) {
        return `$$\n${trimmed}\n$$`;
    }

    return content;
};

// 通用 Markdown 渲染组件
interface MarkdownContentProps {
    content: string;
    className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
    return (
        <div className={cn(
            "prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {smartFormatContent(content)}
            </ReactMarkdown>
        </div>
    );
}

// 远程图片加载组件
interface RemoteImageProps {
    src: string;
    alt: string;
    className?: string;
    question?: Question | null;
}

export function RemoteImage({ src, alt, className, question }: RemoteImageProps) {
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
                    <span>{DICT.common.imageLoadError}</span>
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
    );
}

// 题目内容渲染器 - 统一处理 Markdown 和图片的显示逻辑
interface QuestionContentRendererProps {
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
