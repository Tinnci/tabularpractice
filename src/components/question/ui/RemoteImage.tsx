"use client";

import { useMemo, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import { Question } from "@/lib/types";
import { DICT } from "@/lib/i18n";

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
