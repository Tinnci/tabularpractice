"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useProgressStore } from "@/lib/store";
import { getImageUrl } from "@/lib/utils";
import { Question } from "@/lib/types";
import { DICT } from "@/lib/i18n";

interface CopyButtonProps {
    text?: string | null;
    img?: string | null;
    question: Question;
}

export function CopyButton({ text, img, question }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const { repoBaseUrl, repoSources } = useProgressStore();

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (text) {
                // 1. 优先复制 Markdown 文本
                await navigator.clipboard.writeText(text);
            } else if (img) {
                // 2. 尝试复制图片
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (!url) return;

                // 获取图片 Blob 并写入剪贴板
                // 注意：这需要图片服务器支持 CORS，否则会抛出错误
                const response = await fetch(url);
                const blob = await response.blob();

                // Safari/Chrome 均支持的写入方式
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
            }

            // 成功反馈
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);

            // 降级处理：如果图片数据复制失败（通常是跨域问题），则复制图片链接
            if (!text && img) {
                const url = getImageUrl(img, question, repoBaseUrl, repoSources);
                if (url) {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    // 可选：这里可以用 sonner 提示 "已复制图片链接"
                }
            }
        }
    };

    // 如果既没有文本也没有图片，不渲染按钮
    if (!text && !img) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/50 data-[state=open]:bg-muted"
            onClick={handleCopy}
            title={text ? DICT.common.copyMarkdown : DICT.common.copyImage}
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground" />
            )}
        </Button>
    );
}
