"use client"

import { cn } from "@/lib/utils";
import tagsData from "@/data/tags.json";
import { useProgressStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Hash, Layers } from "lucide-react";

export function Sidebar() {
    const { selectedTagId, setSelectedTagId } = useProgressStore();

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

                    {/* 递归/嵌套渲染目录 */}
                    {tagsData.map((category) => (
                        <div key={category.id} className="pt-4">
                            <h3 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {category.label}
                            </h3>
                            <div className="space-y-1">
                                {category.children?.map((tag) => (
                                    <Button
                                        key={tag.id}
                                        variant={selectedTagId === tag.id ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start text-sm h-9",
                                            selectedTagId === tag.id && "bg-slate-100 font-medium text-primary"
                                        )}
                                        onClick={() => setSelectedTagId(tag.id)}
                                    >
                                        <Folder className={cn("mr-2 h-4 w-4", selectedTagId === tag.id ? "text-blue-500" : "text-slate-400")} />
                                        {tag.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
