import Link from "next/link"
import { SettingsModal } from "@/components/business/SettingsModal"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileSidebar } from "@/components/layout/MobileSidebar"

export function Navbar() {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center px-4">
                <MobileSidebar />
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    {/* 模拟 Logo 图标: 一个简单的方块 */}
                    <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">TP</span>
                    </div>

                    {/* 品牌文字：Tabular 加粗，Practice 变细 */}
                    <span className="hidden font-bold sm:inline-block text-foreground">
                        Tabular<span className="font-light text-muted-foreground">Practice</span>
                    </span>
                </Link>

                <nav className="flex items-center space-x-6 text-sm font-medium ml-auto">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Dashboard
                    </Link>
                    <Link href="/questions" className="transition-colors hover:text-foreground/80 text-foreground">
                        Questions
                    </Link>
                    <SettingsModal />
                    <ModeToggle />
                </nav>
            </div>
        </header>
    )
}
