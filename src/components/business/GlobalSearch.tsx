"use client"

import * as React from "react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Search, BookOpen, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useMemo } from "react"
import { useProgressStore } from "@/lib/store"

import papersData from "@/data/papers.json"
import paperGroupsData from "@/data/paperGroups.json"
import { Question, Paper, PaperGroup } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface Props {
    questions: Question[];
    onQuestionSelect: (id: string) => void;
}

export function GlobalSearch({ questions, onQuestionSelect }: Props) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const { progress } = useProgressStore()

    // 快捷键监听
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // 构建搜索索引
    const searchIndex = useMemo(() => {
        const papers = papersData as Paper[];
        const groups = paperGroupsData as PaperGroup[];

        return questions.map(q => {
            const paper = papers.find(p => p.id === q.paperId);
            const group = paper ? groups.find(g => g.id === paper.groupId) : null;

            return {
                question: q,
                paper,
                group,
                searchText: [
                    paper?.year.toString(),
                    q.number.toString(),
                    group?.name,
                    ...q.tags,
                    q.type === 'choice' ? '选择题' : q.type === 'fill' ? '填空题' : '解答题'
                ].filter(Boolean).join(' ').toLowerCase()
            };
        });
    }, []);

    // 搜索过滤
    const filteredResults = useMemo(() => {
        if (!search.trim()) {
            // 默认显示最近的题目
            return searchIndex.slice(0, 15);
        }

        const searchLower = search.toLowerCase();
        return searchIndex
            .filter(item => item.searchText.includes(searchLower))
            .slice(0, 20);
    }, [search, searchIndex]);

    // 按试卷组分组
    const groupedResults = useMemo(() => {
        const grouped: Record<string, typeof filteredResults> = {};

        filteredResults.forEach(item => {
            const groupName = item.group?.name || '其他';
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(item);
        });

        return grouped;
    }, [filteredResults]);

    const getStatusBadge = (questionId: string) => {
        const status = progress[questionId];
        if (status === 'mastered') return <Badge className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">已斩</Badge>;
        if (status === 'confused') return <Badge className="ml-auto bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs">不熟</Badge>;
        if (status === 'failed') return <Badge className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs">错题</Badge>;
        return null;
    };

    return (
        <>
            {/* 触发按钮 (放在 Navbar) */}
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-lg text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-background border-border hover:bg-muted/50"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="hidden lg:inline-flex">搜索题目...</span>
                <span className="inline-flex lg:hidden">搜索...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="搜索年份、题号或知识点 (如 '2023 1' 或 '极限')..."
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList>
                    <CommandEmpty>
                        <div className="py-6 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">未找到相关题目</p>
                            <p className="text-xs text-muted-foreground">尝试使用年份、题号或知识点关键词</p>
                        </div>
                    </CommandEmpty>

                    {Object.entries(groupedResults).map(([groupName, items]) => (
                        <CommandGroup key={groupName} heading={groupName}>
                            {items.map(({ question, paper }) => (
                                <CommandItem
                                    key={question.id}
                                    value={question.id}
                                    onSelect={() => {
                                        onQuestionSelect(question.id);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className="flex items-center gap-2 py-3"
                                >
                                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />

                                    {/* 年份 */}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-mono text-sm text-muted-foreground">{paper?.year}</span>
                                    </div>

                                    {/* 题号 */}
                                    <span className="font-semibold text-foreground">第 {question.number} 题</span>

                                    {/* 题型 */}
                                    <Badge variant="outline" className="text-xs">
                                        {question.type === 'choice' ? '选择' : question.type === 'fill' ? '填空' : '解答'}
                                    </Badge>

                                    {/* 第一个标签 */}
                                    {question.tags.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Tag className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]">{question.tags[0]}</span>
                                        </div>
                                    )}

                                    {/* 状态 */}
                                    {getStatusBadge(question.id)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    )
}
