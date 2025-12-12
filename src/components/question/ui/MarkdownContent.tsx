"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

// 智能格式化内容：自动检测并包装 LaTeX
export const smartFormatContent = (content: string) => {
    if (!content) return "";
    const trimmed = content.trim();

    // 如果已经被 $$ 包裹，不重复处理
    if (trimmed.startsWith('$$') || trimmed.startsWith('$')) {
        return content;
    }

    // 检测是否包含 LaTeX 环境（如 \begin{cases}, \begin{matrix} 等）
    // 且内容中不包含 $ 符号（避免破坏已有的行内公式混合文本）
    if (trimmed.includes('\\begin{') && !trimmed.includes('$')) {
        return `$$\n${trimmed}\n$$`;
    }

    return content;
};

// 通用 Markdown 渲染组件
export interface MarkdownContentProps {
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
