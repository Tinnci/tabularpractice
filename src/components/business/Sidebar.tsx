"use client"

import { cn } from "@/lib/utils";
import { getTagsForSubject, type TagNode } from "@/data/subject-tags";
import { useProgressStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, ChevronRight, PieChart, Hash } from "lucide-react";
import { useState, useMemo } from "react";
import { ProgressOverview } from "./ProgressOverview";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Question } from "@/lib/types";

import { useContextQuestions } from "@/hooks/useContextQuestions";
import { DICT } from "@/lib/i18n";

export function SidebarContent({ className, onSelect, questions }: { className?: string, onSelect?: () => void, questions?: Question[] }) {
    const { selectedTagId, setSelectedTagId, currentGroupId, filterSubject } = useProgressStore();
    const [isStatsOpen, setIsStatsOpen] = useState(true); // 控制底部统计展开

    const currentTags = useMemo(() => {
        return getTagsForSubject(currentGroupId);
    }, [currentGroupId]);

    const sidebarTitle = useMemo(() => {
        if (filterSubject === 'math') return DICT.nav.mathOutline;
        if (filterSubject === 'english') return DICT.nav.englishOutline;
        if (filterSubject === 'politics') return DICT.nav.politicsOutline;
        return DICT.nav.defaultOutline;
    }, [filterSubject]);

    const { contextQuestions } = useContextQuestions();
    // 使用传入的 questions (上下文感知) 或回退到 hook 计算的 contextQuestions
    const displayQuestions = questions || contextQuestions;
    // 渲染叶子节点 (最终的知识点)
    const renderLeafNode = (node: TagNode) => {
        const isSelected = selectedTagId === node.id;
        return (
            <Tooltip key={node.id} delayDuration={500}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-sm h-7 md:h-8 pl-8 font-normal relative group/leaf transition-all duration-200",
                            isSelected ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => {
                            if (isSelected) {
                                setSelectedTagId(null);
                            } else {
                                setSelectedTagId(node.id);
                            }
                            onSelect?.();
                        }}
                    >
                        {/* 选中指示条 */}
                        {isSelected && (
                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r-full" />
                        )}

                        {/* 点状图标 - 配方3: 父子联动 (Group Hover) + 光晕 */}
                        <div className={cn(
                            "mr-2.5 h-1.5 w-1.5 rounded-full transition-all duration-300 shrink-0",
                            isSelected
                                ? "bg-primary scale-125 shadow-[0_0_6px_hsl(var(--primary))]"
                                : "bg-muted-foreground/40 group-hover/leaf:bg-primary/80 group-hover/leaf:scale-110 group-hover/leaf:shadow-[0_0_4px_hsl(var(--primary)/0.5)]"
                        )} />

                        <span className="truncate leading-none">{node.label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px] break-words">
                    {node.label}
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* 标题区 */}
            <div className="p-3 md:p-4 border-b border-border bg-muted/10 shrink-0">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground tracking-tight">
                    <Layers className="w-5 h-5 text-primary" />
                    {sidebarTitle}
                </h2>
            </div>

            {/* 顶部统计区 - 可折叠 (移到上方) */}
            <div className="border-b border-border bg-muted/5 shrink-0">
                <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                    <div className="flex items-center justify-between p-2 px-3 md:px-4">
                        <CollapsibleTrigger asChild>
                            <div className="w-full">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground">
                                            <span className="flex items-center gap-2"><PieChart className="w-3 h-3" /> {DICT.nav.progress}</span>
                                            <ChevronRight className={cn("w-3 h-3 transition-transform", isStatsOpen && "rotate-90")} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isStatsOpen ? DICT.nav.collapseStats : DICT.nav.expandStats}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <div className="px-4 pb-4">
                            <ProgressOverview questions={displayQuestions} />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* 滚动列表区 */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 md:p-3 space-y-1 pb-10">
                    <Button
                        variant={selectedTagId === null ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start text-foreground font-medium mb-2 md:mb-4",
                            selectedTagId === null && "bg-accent shadow-sm"
                        )}
                        onClick={() => { setSelectedTagId(null); onSelect?.(); }}
                    >
                        <Hash className="mr-2 h-4 w-4" />
                        {DICT.common.all}
                    </Button>

                    {/* 使用 Accordion 实现一级菜单 */}
                    <Accordion type="multiple" className="w-full space-y-2" defaultValue={currentTags.map(t => t.id)}>
                        {currentTags.map((category) => (
                            <AccordionItem key={category.id} value={category.id} className="border-none">
                                <AccordionTrigger className="py-2 px-2 hover:bg-muted/50 rounded-md text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                                    {category.label}
                                </AccordionTrigger>
                                <AccordionContent className="pb-0 pt-1">
                                    <div className="space-y-0.5">
                                        {category.children?.map(child => {
                                            // 如果二级菜单还有子级 (三级结构)
                                            if (child.children && child.children.length > 0) {
                                                return (
                                                    <Accordion type="multiple" key={child.id} defaultValue={[child.id]}>
                                                        <AccordionItem value={child.id} className="border-none relative">
                                                            {/* 连接线 */}
                                                            <div className="absolute left-2.5 top-8 bottom-2 w-px bg-border/50" />

                                                            <AccordionTrigger className="py-1.5 px-2 hover:bg-muted/30 rounded-md text-sm font-medium text-foreground hover:no-underline justify-start gap-2 [&[data-state=open]>svg]:rotate-90">
                                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 transition-transform duration-200" />
                                                                <span className="truncate">{child.label}</span>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pl-2 pb-1">
                                                                {child.children.map(subChild => renderLeafNode(subChild))}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )
                                            }
                                            // 二级就是叶子
                                            return renderLeafNode(child);
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    {currentTags.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                            <p>{DICT.practice.noTags}</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// 2. Desktop Sidebar (保持原样，但内部调用 SidebarContent)
export function Sidebar({ questions }: { questions?: Question[] }) {
    return (
        <div className="w-64 flex-shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 hidden md:flex flex-col">
            <SidebarContent questions={questions} />
        </div>
    );
}
