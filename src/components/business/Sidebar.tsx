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

export function Sidebar() {
    const { selectedTagId, setSelectedTagId, currentGroupId } = useProgressStore();
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // 根据当前试卷组ID动态获取知识点树
    const currentTags = useMemo(() => {
        return getTagsForSubject(currentGroupId);
    }, [currentGroupId]);

    // 根据 groupId 生成标题
    const sidebarTitle = useMemo(() => {
        if (currentGroupId.startsWith('math')) return '数学考点';
        if (currentGroupId.startsWith('english')) return '英语题型';
        if (currentGroupId.startsWith('politics')) return '政治大纲';
        return '考点目录';
    }, [currentGroupId]);

    // 计算总题数 (这里简单使用总数，后续可以根据科目筛选)
    const totalQuestions = questionsData.length;

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // 递归渲染函数
    const renderTagNode = (node: TagNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedCategories.includes(node.id);
        const isSelected = selectedTagId === node.id;

        if (level === 0) {
            // 一级分类 (如 "高等数学")
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
        } else if (level === 1) {
            // 二级分类 (如 "函数、极限、连续")
            return (
                <div key={node.id}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-sm h-8 px-2",
                            isSelected && !hasChildren && "bg-accent font-medium"
                        )}
                        onClick={() => {
                            if (hasChildren) {
                                toggleCategory(node.id);
                            } else {
                                // 二级本身就是叶子节点 (如英语的"完形填空")
                                setSelectedTagId(node.id);
                            }
                        }}
                    >
                        {hasChildren && (
                            <ChevronRight
                                className={cn(
                                    "mr-1 h-3 w-3 transition-transform",
                                    isExpanded && "rotate-90"
                                )}
                            />
                        )}
                        <Folder className={cn(
                            "mr-2 h-3 w-3",
                            isSelected && !hasChildren ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="truncate">{node.label}</span>
                    </Button>

                    {/* 三级子项 */}
                    {hasChildren && isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                            {node.children?.map(child => (
                                <Button
                                    key={child.id}
                                    variant={selectedTagId === child.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start text-xs h-7 px-2",
                                        selectedTagId === child.id && "bg-accent text-accent-foreground font-medium"
                                    )}
                                    onClick={() => setSelectedTagId(child.id)}
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
        return null;
    };

    return (
        <div className="w-64 flex-shrink-0 border-r bg-background h-[calc(100vh-3.5rem)] sticky top-14 hidden md:flex flex-col">
            <div className="p-4 border-b bg-muted/50 flex-shrink-0">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    {sidebarTitle}
                </h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-1">
                    {/* "全部" 按钮 */}
                    <Button
                        variant={selectedTagId === null ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedTagId(null)}
                    >
                        <Hash className="mr-2 h-4 w-4" />
                        全部题目
                    </Button>

                    {/* 渲染当前科目的知识点树 */}
                    {currentTags.map(node => renderTagNode(node, 0))}

                    {/* 空状态提示 */}
                    {currentTags.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            <p>暂无该科目目录数据</p>
                            <p className="text-xs mt-2">请在 subject-tags.ts 中添加</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* 底部统计区 */}
            <div className="p-4 border-t bg-muted/50 flex-shrink-0">
                <ProgressOverview total={totalQuestions} />
            </div>
        </div>
    );
}
