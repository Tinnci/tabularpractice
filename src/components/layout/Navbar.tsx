"use client";

import Link from "next/link"
import { SettingsModal } from "@/components/business/SettingsModal"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar } from "@/components/layout/MobileSidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
    const pathname = usePathname();
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
                        {/* 模拟 Logo 图标: 一个简单的方块 */}
                        <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">TP</span>
                        </div>

                        {/* 品牌文字：Tabular 加粗，Practice 变细 */}
                        <span className="hidden font-bold sm:inline-block text-foreground">
                            Tabular<span className="font-light text-muted-foreground">Practice</span>
                        </span>
                    </Link>

                    <nav className="flex items-center space-x-2 sm:space-x-6 text-sm font-medium ml-auto app-region-no-drag">
                        <Link href="/" className={cn("transition-colors hover:text-foreground/80 hidden sm:inline-block", pathname === "/" ? "text-foreground" : "text-foreground/60")}>
                            Dashboard
                        </Link>
                        <Link href="/questions" className={cn("transition-colors hover:text-foreground/80 hidden sm:inline-block", pathname.startsWith("/questions") ? "text-foreground" : "text-foreground/60")}>
                            Questions
                        </Link>
                        <SettingsModal />
                        <ModeToggle />
                    </nav>
                </div>
            </div>
        </header>
    )
}
