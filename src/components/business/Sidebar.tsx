"use client"

import { cn } from "@/lib/utils";
import { getTagsForSubject, type TagNode } from "@/data/subject-tags";
import { useProgressStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Hash, Layers, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { ProgressOverview } from "./ProgressOverview";
import questionsData from "@/data/questions.json";

// 1. 提取出的通用内容组件
// 增加了 onSelect 回调，用于移动端点击后自动关闭抽屉
export function SidebarContent({ className, onSelect }: { className?: string, onSelect?: () => void }) {
    const { selectedTagId, setSelectedTagId, currentGroupId } = useProgressStore();
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const currentTags = useMemo(() => {
        return getTagsForSubject(currentGroupId);
    }, [currentGroupId]);

    const sidebarTitle = useMemo(() => {
        if (currentGroupId.startsWith('math')) return '数学考点';
        if (currentGroupId.startsWith('english')) return '英语题型';
        if (currentGroupId.startsWith('politics')) return '政治大纲';
        return '考点目录';
    }, [currentGroupId]);

    // 估算当前科目的总题数 (仅做参考，如果要精确需要遍历)
    // 这里简单使用总数，后续可以根据科目筛选
    const totalQuestions = questionsData.length;

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const renderTagNode = (node: TagNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedCategories.includes(node.id);
        const isSelected = selectedTagId === node.id;

        // 处理点击逻辑：如果是叶子节点，选中并触发 onSelect
        const handleClick = () => {
            if (hasChildren) {
                toggleCategory(node.id);
            } else {
                setSelectedTagId(node.id);
                onSelect?.(); // 移动端关闭抽屉
            }
        };

        if (level === 0) {
            return (
                <div key={node.id} className="pt-4">
                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {node.label}
                    </h3>
                    <div className="space-y-0.5">
                        {node.children?.map(child => renderTagNode(child, 1))}
                    </div>
                </div>
            );
        } else {
            return (
                <div key={node.id}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-sm h-8 px-2 font-normal",
                            isSelected && !hasChildren && "bg-accent text-accent-foreground font-medium"
                        )}
                        onClick={handleClick}
                    >
                        {hasChildren && (
                            <ChevronRight className={cn("mr-1 h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                        )}
                        <Folder className={cn("mr-2 h-3 w-3", isSelected && !hasChildren ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate">{node.label}</span>
                    </Button>

                    {hasChildren && isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-1">
                            {node.children?.map(child => (
                                <Button
                                    key={child.id}
                                    variant={selectedTagId === child.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start text-xs h-7 px-2",
                                        selectedTagId === child.id && "bg-accent text-accent-foreground font-medium"
                                    )}
                                    onClick={() => {
                                        setSelectedTagId(child.id);
                                        onSelect?.();
                                    }}
                                >
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground mr-2" />
                                    <span className="truncate">{child.label}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* 标题区 */}
            <div className="p-4 border-b border-border bg-muted/20">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    {sidebarTitle}
                </h2>
            </div>

            {/* 滚动列表区 */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-1">
                    <Button
                        variant={selectedTagId === null ? "secondary" : "ghost"}
                        className="w-full justify-start text-foreground font-medium"
                        onClick={() => { setSelectedTagId(null); onSelect?.(); }}
                    >
                        <Hash className="mr-2 h-4 w-4" />
                        全部题目
                    </Button>

                    {currentTags.map(node => renderTagNode(node, 0))}

                    {currentTags.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            <p>暂无目录数据</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* 底部统计区 */}
            <div className="p-4 border-t border-border bg-muted/20">
                <ProgressOverview total={totalQuestions} />
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
