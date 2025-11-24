import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"

interface Props {
    question: Question;
    onClick: () => void;
}

// 状态对应的 Tailwind 颜色类映射
const statusColors: Record<Status, string> = {
    unanswered: "bg-white hover:bg-slate-50 border-slate-200",
    mastered: "bg-green-100 hover:bg-green-200 border-green-300",
    confused: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
    failed: "bg-red-100 hover:bg-red-200 border-red-300",
}

export function QuestionCard({ question, onClick }: Props) {
    const status = question.status || 'unanswered';

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
                statusColors[status]
            )}
            onClick={onClick}
        >
            <CardContent className="p-2 flex flex-col items-center justify-center h-24 relative">
                {/* 这里放缩略图或占位符 */}
                <div className="text-slate-300 text-2xl font-bold select-none">?</div>
                {question.tags.length > 0 && (
                    <div className="absolute bottom-1 right-2 flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-300" title={question.tags.join(', ')} />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
