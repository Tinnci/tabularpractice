"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SidebarContent } from "@/components/business/Sidebar";
import { useState } from "react";

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">打开目录</span>
                </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-[80%] max-w-[300px] border-r border-border">
                {/* Shadcn Sheet (Dialog) 要求必须有 Title 和 Description 以符合无障碍标准。
           使用 sr-only 隐藏它们。
        */}
                <SheetTitle className="sr-only">考点目录导航</SheetTitle>
                <SheetDescription className="sr-only">选择章节进行筛选</SheetDescription>

                {/* 复用 SidebarContent，并传入关闭回调 */}
                <SidebarContent onSelect={() => setOpen(false)} />

            </SheetContent>
        </Sheet>
    );
}
