"use client";

import ReactMarkdown from "react-markdown";
import type { ExtraProps } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { ControlVisualizationRenderer } from "./ControlVisualization/ControlVisualizationRenderer";
import type { ControlVisualizationConfig } from "./ControlVisualization/types";

type CodeProps = React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps & { inline?: boolean };

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
                components={{
                    code({ inline, className, children, ...props }: CodeProps) {
                        const match = /language-control-viz/.test(className || '');
                        if (!inline && match) {
                            try {
                                const codeContent = String(children).replace(/\n$/, '');
                                const parsed = JSON.parse(codeContent);
                                // Extract height if present in the JSON, defaulting to 300
                                const { height, ...config } = parsed;

                                return (
                                    <div className="my-6 not-prose">
                                        <ControlVisualizationRenderer
                                            config={config as ControlVisualizationConfig}
                                            height={typeof height === 'number' ? height : 300}
                                        />
                                    </div>
                                );
                            } catch (e) {
                                return (
                                    <div className="p-4 my-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                        <p className="font-bold mb-2">Visualization Error</p>
                                        <div className="text-sm opacity-80 mb-2">{String(e)}</div>
                                        <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-auto max-h-40">
                                            {String(children)}
                                        </pre>
                                    </div>
                                );
                            }
                        }
                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {smartFormatContent(content)}
            </ReactMarkdown>
        </div>
    );
}
