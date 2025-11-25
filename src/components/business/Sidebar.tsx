"use client"

import { cn } from "@/lib/utils";
import { getTagsForSubject, type TagNode } from "@/data/subject-tags";
import { useProgressStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Hash, Layers, ChevronRight, PieChart } from "lucide-react";
import { useState, useMemo } from "react";
import { ProgressOverview } from "./ProgressOverview";
import { useQuestions } from "@/hooks/useQuestions";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


export function SidebarContent({ className, onSelect }: { className?: string, onSelect?: () => void }) {
    const { selectedTagId, setSelectedTagId, currentGroupId, filterSubject } = useProgressStore();
    const [isStatsOpen, setIsStatsOpen] = useState(true); // 控制底部统计展开

    const currentTags = useMemo(() => {
        return getTagsForSubject(currentGroupId);
    }, [currentGroupId]);

    const sidebarTitle = useMemo(() => {
        if (filterSubject === 'math') return '数学考点';
        if (filterSubject === 'english') return '英语题型';
        if (filterSubject === 'politics') return '政治大纲';
        return '考点目录';
    }, [filterSubject]);

    const { questionsIndex } = useQuestions();
    const totalQuestions = questionsIndex.length;

    // 渲染叶子节点 (最终的知识点)
    const renderLeafNode = (node: TagNode) => {
        const isSelected = selectedTagId === node.id;
        return (
            <Button
                key={node.id}
                variant="ghost"
                className={cn(
                    "w-full justify-start text-sm h-9 pl-9 font-normal relative",
                    isSelected ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                )}
                onClick={() => {
                    setSelectedTagId(node.id);
                    onSelect?.();
                }}
            >
                {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Folder className={cn("mr-2 h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground/50")} />
                <span className="truncate">{node.label}</span>
            </Button>
        );
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* 标题区 */}
            <div className="p-4 border-b border-border bg-muted/10 shrink-0">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground tracking-tight">
                    <Layers className="w-5 h-5 text-primary" />
                    {sidebarTitle}
                </h2>
            </div>

            {/* 滚动列表区 */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                    <Button
                        variant={selectedTagId === null ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start text-foreground font-medium mb-4",
                            selectedTagId === null && "bg-accent shadow-sm"
                        )}
                        onClick={() => { setSelectedTagId(null); onSelect?.(); }}
                    >
                        <Hash className="mr-2 h-4 w-4" />
                        全部题目
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
                                                    <Accordion type="multiple" key={child.id}>
                                                        <AccordionItem value={child.id} className="border-none">
                                                            <AccordionTrigger className="py-1.5 px-4 hover:bg-muted/30 rounded-md text-sm font-normal text-foreground hover:no-underline justify-start gap-2">
                                                                {/* 这里的 Chevron 默认在右侧，可以通过 class 调整 */}
                                                                <span className="truncate">{child.label}</span>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
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
                            <p>暂无目录数据</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* 底部统计区 - 可折叠 */}
            <div className="border-t border-border bg-muted/10 shrink-0">
                <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                    <div className="flex items-center justify-between p-2 px-4">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground">
                                <span className="flex items-center gap-2"><PieChart className="w-3 h-3" /> 刷题进度</span>
                                <ChevronRight className={cn("w-3 h-3 transition-transform", isStatsOpen && "rotate-90")} />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <div className="px-4 pb-4">
                            <ProgressOverview total={totalQuestions} />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}

// 2. Desktop Sidebar (保持原样，但内部调用 SidebarContent)
export function Sidebar() {
    return (
        <div className="w-64 flex-shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 hidden md:flex flex-col">
            <SidebarContent />
        </div>
    );
}
