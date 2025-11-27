"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, ListTodo } from "lucide-react";
import Link from "next/link";
import { SidebarContent } from "@/components/business/Sidebar";
import { useProgressStore } from "@/lib/store";

export function MobileSidebar() {
    const { mobileSidebarOpen, setMobileSidebarOpen } = useProgressStore();

    return (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">打开目录</span>
                </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-[280px] border-r border-border flex flex-col h-full">
                {/* Shadcn Sheet (Dialog) 要求必须有 Title 和 Description 以符合无障碍标准。
           使用 sr-only 隐藏它们。
        */}
                <SheetTitle className="sr-only">考点目录导航</SheetTitle>
                <SheetDescription className="sr-only">选择章节进行筛选</SheetDescription>

                {/* 顶部主导航 (移动端独有) */}
                <div className="p-4 border-b space-y-1 bg-muted/20">
                    <Link href="/" onClick={() => setMobileSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-10 font-normal">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/questions" onClick={() => setMobileSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-10 font-normal">
                            <ListTodo className="w-4 h-4" />
                            Questions
                        </Button>
                    </Link>
                </div>

                {/* 复用 SidebarContent，并传入关闭回调 */}
                <div className="flex-1 min-h-0">
                    <SidebarContent onSelect={() => setMobileSidebarOpen(false)} />
                </div>

            </SheetContent>
        </Sheet>
    );
}
