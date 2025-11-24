"use client"

import { cn } from "@/lib/utils";
import tagsData from "@/data/tags.json";
import { useProgressStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Hash, Layers, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const { selectedTagId, setSelectedTagId } = useProgressStore();
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    return (
        <div className="w-64 flex-shrink-0 border-r bg-white h-[calc(100vh-3.5rem)] sticky top-14 hidden md:block">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-500" />
                    考点目录
                </h2>
            </div>

            <ScrollArea className="h-[calc(100%-4rem)]">
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

                    {/* 三级嵌套渲染目录 */}
                    {tagsData.map((category) => (
                        <div key={category.id} className="pt-4">
                            <h3 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {category.label}
                            </h3>
                            <div className="space-y-0.5">
                                {category.children?.map((subCategory) => (
                                    <div key={subCategory.id}>
                                        {/* 二级标题 */}
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start text-sm h-8 px-2",
                                                selectedTagId === subCategory.id && "bg-slate-100 font-medium"
                                            )}
                                            onClick={() => {
                                                if (subCategory.children && subCategory.children.length > 0) {
                                                    toggleCategory(subCategory.id);
                                                } else {
                                                    setSelectedTagId(subCategory.id);
                                                }
                                            }}
                                        >
                                            {subCategory.children && subCategory.children.length > 0 && (
                                                <ChevronRight
                                                    className={cn(
                                                        "mr-1 h-3 w-3 transition-transform",
                                                        expandedCategories.includes(subCategory.id) && "rotate-90"
                                                    )}
                                                />
                                            )}
                                            <Folder className={cn(
                                                "mr-2 h-3 w-3",
                                                selectedTagId === subCategory.id ? "text-blue-500" : "text-slate-400"
                                            )} />
                                            <span className="truncate">{subCategory.label}</span>
                                        </Button>

                                        {/* 三级子项 */}
                                        {expandedCategories.includes(subCategory.id) && subCategory.children && (
                                            <div className="ml-4 mt-0.5 space-y-0.5">
                                                {subCategory.children.map((item) => (
                                                    <Button
                                                        key={item.id}
                                                        variant={selectedTagId === item.id ? "secondary" : "ghost"}
                                                        className={cn(
                                                            "w-full justify-start text-xs h-7 px-2",
                                                            selectedTagId === item.id && "bg-blue-50 text-blue-700 font-medium"
                                                        )}
                                                        onClick={() => setSelectedTagId(item.id)}
                                                    >
                                                        <span className="w-1 h-1 rounded-full bg-slate-400 mr-2" />
                                                        <span className="truncate">{item.label}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
