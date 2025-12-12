"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getTagLabel } from "@/data/subject-tags";
import { DICT } from "@/lib/i18n";

export interface SmartTagListProps {
    tags?: string[];
    tagNames?: string[];
    limit?: number;
    className?: string;
}

export function SmartTagList({
    tags = [],
    tagNames = [],
    limit = 2,
    className
}: SmartTagListProps) {
    // 预处理所有标签的最终显示文本
    const displayTags = useMemo(() => {
        return tags.map((tagId, index) => {
            // 优先级: 1. 后端传回的名称 -> 2. 本地映射的中文 -> 3. 原始ID
            return tagNames?.[index] || getTagLabel(tagId);
        });
    }, [tags, tagNames]);

    if (displayTags.length === 0) return null;

    // 分割为"可见部分"和"隐藏部分"
    const visibleTags = displayTags.slice(0, limit);
    const hiddenTags = displayTags.slice(limit);
    const hasHidden = hiddenTags.length > 0;

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            {visibleTags.map((tag, index) => (
                <Badge
                    key={index}
                    variant="outline"
                    className="text-xs font-normal text-muted-foreground bg-muted/30 whitespace-nowrap h-6 px-2 hover:bg-muted/50 cursor-default border-muted-foreground/20"
                >
                    {tag}
                </Badge>
            ))}

            {hasHidden && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="secondary"
                                className="text-xs h-6 px-1.5 cursor-default hover:bg-secondary/80 transition-colors"
                                title={DICT.practice.moreTags}
                            >
                                +{hiddenTags.length}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-[250px] p-3 bg-popover text-popover-foreground border shadow-md">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground">{DICT.practice.includedTags}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hiddenTags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-normal bg-muted/50">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}
