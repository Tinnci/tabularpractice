"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, ListTodo, Dumbbell } from "lucide-react";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { SidebarContent } from "@/components/business/Sidebar";
import { useProgressStore } from "@/lib/store";
import { DICT } from "@/lib/i18n";

export function MobileSidebar() {
    const { mobileSidebarOpen, setMobileSidebarOpen } = useProgressStore();

    return (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-2 transition-transform duration-300 hover:scale-110 active:scale-95">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">{DICT.nav.openMenu}</span>
                        </Button>
                    </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{DICT.nav.openMenu}</p>
                </TooltipContent>
            </Tooltip>

            <SheetContent side="left" className="p-0 w-[280px] border-r border-border flex flex-col h-full">
                {/* Shadcn Sheet (Dialog) 要求必须有 Title 和 Description 以符合无障碍标准。
           使用 sr-only 隐藏它们。
        */}
                <SheetTitle className="sr-only">{DICT.nav.defaultOutline}</SheetTitle>
                <SheetDescription className="sr-only">{DICT.nav.selectChapter}</SheetDescription>

                {/* 顶部主导航 (移动端独有) */}
                <div className="p-4 border-b space-y-1 bg-muted/20">
                    <Link href="/" onClick={() => setMobileSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-10 font-normal">
                            <LayoutDashboard className="w-4 h-4" />
                            {DICT.nav.dashboard}
                        </Button>
                    </Link>
                    <Link href="/questions" onClick={() => setMobileSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-10 font-normal">
                            <ListTodo className="w-4 h-4" />
                            {DICT.nav.questions}
                        </Button>
                    </Link>
                    <Link href="/practice" onClick={() => setMobileSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-10 font-normal">
                            <Dumbbell className="w-4 h-4" />
                            {DICT.nav.practice}
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
