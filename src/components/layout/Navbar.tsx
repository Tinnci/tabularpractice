import Link from "next/link"
import { SettingsModal } from "@/components/business/SettingsModal"

export function Navbar() {
    return (
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center px-4">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    {/* 模拟 Logo 图标: 一个简单的方块 */}
                    <div className="h-6 w-6 bg-slate-900 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-xs">TP</span>
                    </div>

                    {/* 品牌文字：Tabular 加粗，Practice 变细 */}
                    <span className="hidden font-bold sm:inline-block text-slate-900">
                        Tabular<span className="font-light text-slate-600">Practice</span>
                    </span>
                </Link>

                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Dashboard
                    </Link>
                    <Link href="/questions" className="transition-colors hover:text-foreground/80 text-foreground">
                        Questions
                    </Link>
                    <SettingsModal />
                </nav>
            </div>
        </header>
    )
}
