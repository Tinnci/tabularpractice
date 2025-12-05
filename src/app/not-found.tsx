import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="glass-card p-12 rounded-2xl max-w-lg w-full flex flex-col items-center">
                <div className="relative">
                    <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary/20 to-primary/5 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold bg-background/50 backdrop-blur-sm px-4 py-1 rounded-full border shadow-sm">
                            Page Not Found
                        </span>
                    </div>
                </div>

                <p className="text-muted-foreground mt-8 mb-8 text-lg max-w-sm leading-relaxed">
                    抱歉，我们找不到您要访问的页面。它可能已被移动或不存在。
                </p>

                <Link href="/">
                    <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-primary/25 transition-all">
                        返回首页
                    </Button>
                </Link>
            </div>
        </div>
    );
}
