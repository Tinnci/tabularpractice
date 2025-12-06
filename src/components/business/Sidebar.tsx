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


    // 获取进度状态 (用于计算完成度)
    // 提到 useMemo 之前
    const progress = useProgressStore(state => state.progress);

    // 4. 计算每个 Tag 的统计数据 (递归)
    const tagStats = useMemo(() => {
        const stats: Record<string, { total: number, finished: number }> = {};

        // 辅助函数：获取一个节点下所有相关的 questions
        // 如果是叶子节点，匹配 id；如果是父节点，匹配所有子孙节点的 id
        const getRelatedQuestions = (node: TagNode): Question[] => {
            // 1. 收集该节点及其子树包含的所有 tag ID
            const relevantTagIds = new Set<string>();
            const collectIds = (n: TagNode) => {
                relevantTagIds.add(n.id);
                if (n.children) {
                    n.children.forEach(collectIds);
                }
            };
            collectIds(node);

            // 2. 过滤出一个问题是否包含上述任一 ID
            return displayQuestions.filter(q =>
                q.tags.some(tag => relevantTagIds.has(tag))
            );
        };

        const computeStats = (nodes: TagNode[]) => {
            nodes.forEach(node => {
                const relatedQs = getRelatedQuestions(node);
                const total = relatedQs.length;
                const finished = relatedQs.filter(q => {
                    const status = progress[q.id];
                    return status === 'mastered' || status === 'confused' || status === 'failed';
                }).length;

                stats[node.id] = { total, finished };

                if (node.children) {
                    computeStats(node.children);
                }
            });
        };

        computeStats(currentTags);
        return stats;
    }, [displayQuestions, currentTags, progress]);




    // 渲染叶子节点 (最终的知识点) - 增强 UI
    const renderLeafNode = (node: TagNode) => {
        const isSelected = selectedTagId === node.id;
        const stat = tagStats[node.id] || { total: 0, finished: 0 };
        // 计算完成度颜色
        const isComplete = stat.total > 0 && stat.finished === stat.total;
        const width = stat.total > 0 ? (stat.finished / stat.total) * 100 : 0;

        return (
            <Tooltip key={node.id} delayDuration={500}>
                <TooltipTrigger asChild>
                    <div className="relative group/leaf px-1 py-0.5">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-between text-sm h-8 pl-6 pr-2 font-normal relative transition-all duration-200 overflow-hidden",
                                isSelected
                                    ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                stat.total === 0 && "opacity-60"
                            )}
                            onClick={() => {
                                // 点击交互
                                if (isSelected) setSelectedTagId(null);
                                else setSelectedTagId(node.id);
                                onSelect?.();
                            }}
                        >
                            {/* 进度背景条 - 仅在 hover 或选中时且有进度时微弱显示 */}
                            {stat.finished > 0 && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-500 z-0"
                                    style={{ width: `${width}%` }}
                                />
                            )}

                            <div className="flex items-center gap-2 z-10 min-w-0 flex-1">
                                {/* 点状图标 */}
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-all duration-300 shrink-0",
                                    isSelected
                                        ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary))]"
                                        : isComplete ? "bg-green-500/50" : "bg-muted-foreground/30 group-hover/leaf:bg-primary/60"
                                )} />
                                <span className={cn("truncate leading-none", isSelected && "font-semibold")}>
                                    {node.label}
                                </span>
                            </div>

                            {/* 右侧统计 Badge */}
                            {stat.total > 0 && (
                                <span className={cn(
                                    "text-[10px] tabular-nums px-1.5 py-0.5 rounded-full z-10 transition-colors",
                                    isSelected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover/leaf:bg-muted"
                                )}>
                                    {stat.finished}/{stat.total}
                                </span>
                            )}
                        </Button>

                        {/* 选中指示条 (左边缘) */}
                        {isSelected && (
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_hsl(var(--primary))]" />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <div className="text-xs">
                        <p className="font-semibold">{node.label}</p>
                        <p className="text-muted-foreground">已完成 {stat.finished} / 共 {stat.total} 题</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <div className={cn("flex flex-col h-full bg-background/80", className)}>
            {/* 标题区 */}
            <div className="p-3 md:p-4 border-b border-border/40 shrink-0">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground/90 tracking-tight">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Layers className="w-4 h-4" />
                    </div>
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
                        <div className="px-3 pb-3 overflow-hidden">
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
                            "w-full justify-between px-3 text-sm font-medium mb-4 rounded-lg transition-all border",
                            selectedTagId === null
                                ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                : "text-foreground border-transparent hover:bg-muted/50"
                        )}
                        onClick={() => { setSelectedTagId(null); onSelect?.(); }}
                    >
                        <div className="flex items-center">
                            <Hash className="mr-2 h-4 w-4" />
                            {DICT.common.all}
                        </div>
                        <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full tabular-nums opacity-70">
                            {displayQuestions.length}
                        </span>
                    </Button>

                    {/* 使用 Accordion 实现一级菜单 */}
                    <Accordion type="multiple" className="w-full space-y-3" defaultValue={currentTags.map(t => t.id)}>
                        {currentTags.map((category) => {
                            const catStat = tagStats[category.id] || { total: 0, finished: 0 };

                            return (
                                <AccordionItem key={category.id} value={category.id} className="border border-border/40 rounded-lg bg-card/30 overflow-hidden shadow-sm">
                                    <AccordionTrigger className="py-2.5 px-3 hover:bg-muted/50 text-sm font-semibold text-foreground/80 hover:no-underline group transition-colors">
                                        <div className="flex flex-col items-start gap-1 w-full mr-2">
                                            <div className="flex justify-between w-full items-center gap-2">
                                                <span className="truncate flex-1 min-w-0 text-left">{category.label}</span>
                                                <span className="text-[10px] font-normal text-muted-foreground bg-muted/50 px-1.5 rounded-md tabular-nums shrink-0">
                                                    {catStat.finished} / {catStat.total}
                                                </span>
                                            </div>
                                            {/* Mini Progress Bar for Category */}
                                            <div className="h-0.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/60 rounded-full transition-all duration-1000"
                                                    style={{ width: catStat.total ? `${(catStat.finished / catStat.total) * 100}%` : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1 pt-0">
                                        <div className="space-y-0.5 p-1">
                                            {category.children?.map(child => {
                                                // 如果二级菜单还有子级 (三级结构)
                                                if (child.children && child.children.length > 0) {
                                                    const subStat = tagStats[child.id] || { total: 0, finished: 0 };
                                                    return (
                                                        <Accordion type="multiple" key={child.id} defaultValue={[child.id]}>
                                                            <AccordionItem value={child.id} className="border-none relative">
                                                                {/* 连接线 */}
                                                                <div className="absolute left-3 top-8 bottom-3 w-px bg-border/40" />

                                                                <AccordionTrigger className="py-1.5 px-2 hover:bg-muted/30 rounded-md text-sm font-medium text-foreground/90 hover:no-underline justify-start gap-1 [&[data-state=open]>svg]:rotate-90">
                                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-200" />
                                                                    <div className="flex-1 flex justify-between items-center pr-2 min-w-0 gap-2">
                                                                        <span className="truncate min-w-0">{child.label}</span>
                                                                        {subStat.total > 0 && (
                                                                            <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                                                                                {subStat.finished}/{subStat.total}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pl-3 pb-1">
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
                            )
                        })}
                    </Accordion>

                    {currentTags.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                            <p>{DICT.practice.noTagsAvailable}</p>
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
        <aside className="w-72 flex-shrink-0 border-r border-border/40 h-[calc(100vh-3.5rem)] sticky top-14 hidden md:flex flex-col glass z-30">
            <SidebarContent questions={questions} className="bg-transparent" />
        </aside>
    );
}
