"use client";

import { useState } from "react"
import Link from "next/link"
import { SettingsModal } from "@/components/business/SettingsModal"
import { AiImportModal } from "@/components/business/AiImportModal"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar } from "@/components/layout/MobileSidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function Navbar() {
    const pathname = usePathname();
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 app-region-drag">
            {/* WCO Safe Area Wrapper */}
            <div
                className="flex h-14 items-center w-full"
                style={{
                    paddingLeft: 'env(titlebar-area-x, 0px)',
                    paddingRight: 'calc(100vw - (env(titlebar-area-x, 0px) + env(titlebar-area-width, 100vw)))',
                    width: '100%'
                } as React.CSSProperties}
            >
                <div className="container flex h-14 items-center px-4 w-full mx-auto">
                    <div className="app-region-no-drag flex items-center">
                        <MobileSidebar />
                    </div>
                    <Link href="/" className="mr-6 flex items-center space-x-2 app-region-no-drag">
                        {/* 模拟 Logo 图标: 一个简单的方块 - 配方1: 微缩放与弹性 */}
                        <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-6 shadow-sm">
                            <span className="text-primary-foreground font-bold text-xs">TP</span>
                        </div>

                        {/* 品牌文字：Tabular 加粗，Practice 变细 */}
                        <span className="hidden font-bold sm:inline-block text-foreground">
                            Tabular<span className="font-light text-muted-foreground">Practice</span>
                        </span>
                    </Link>

                    <nav className="flex items-center space-x-2 sm:space-x-6 text-sm font-medium ml-auto app-region-no-drag">
                        <Link href="/" className={cn("transition-all duration-300 hover:text-primary hidden sm:inline-block relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full", pathname === "/" ? "text-foreground font-medium after:w-full" : "text-foreground/60")}>
                            Dashboard
                        </Link>
                        <Link href="/questions" className={cn("transition-all duration-300 hover:text-primary hidden sm:inline-block relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full", pathname.startsWith("/questions") ? "text-foreground font-medium after:w-full" : "text-foreground/60")}>
                            Questions
                        </Link>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setIsAiModalOpen(true)}>
                                    <Sparkles className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">AI 导入</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>AI 智能导题</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <SettingsModal />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>设置</p>
                            </TooltipContent>
                        </Tooltip>
                        <ModeToggle />
                    </nav>
                </div>
            </div>
            <AiImportModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
        </header>
    )
}
