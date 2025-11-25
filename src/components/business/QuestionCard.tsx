import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"
import { useProgressStore } from "@/lib/store"
import { PenLine } from "lucide-react"

interface Props {
    question: Question;
    onClick: () => void;
}

// 状态对应的 Tailwind 颜色类映射
const statusColors: Record<Status, string> = {
    unanswered: "bg-card hover:bg-accent border-border",
    mastered: "bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-900",
    confused: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-900",
    failed: "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-900",
}

export function QuestionCard({ question, onClick }: Props) {
    const status = question.status || 'unanswered';
    const { notes } = useProgressStore();
    const hasNote = !!notes[question.id];

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg relative",
                statusColors[status]
            )}
            onClick={onClick}
        >
            <CardContent className="p-1.5 flex flex-col items-center justify-center h-16 relative">
                {/* 题号 - 左上角 */}
                <div className="absolute top-1 left-1.5 text-xs font-bold opacity-50">
                    {question.number}
                </div>

                {/* 简化的内容展示 */}
                <div className="text-muted-foreground/20 text-lg font-bold select-none">
                    {/* 可以放简短的类型标识，或者干脆留白 */}
                </div>

                {/* 笔记指示器 */}
                {hasNote && (
                    <div className="absolute top-1 right-1">
                        <PenLine className="w-3 h-3 text-orange-500/70" />
                    </div>
                )}

                {question.tags.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
