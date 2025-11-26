import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"
import { useProgressStore } from "@/lib/store"
import { PenLine, Star } from "lucide-react"

interface Props {
    question: Question;
    onClick: () => void;
    isDimmed?: boolean;
}

// 状态对应的 Tailwind 颜色类映射
const statusColors: Record<Status, string> = {
    unanswered: "bg-card hover:bg-accent border-border",
    mastered: "bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-900",
    confused: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-900",
    failed: "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-900",
}

export function QuestionCard({ question, onClick, isDimmed = false }: Props) {
    const status = question.status || 'unanswered';
    const { notes, stars, toggleStar, repoBaseUrl } = useProgressStore();
    const hasNote = !!notes[question.id];
    const isStarred = !!stars[question.id];

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleStar(question.id);
    };

    const getImageUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith('http') || url.startsWith('data:')) return url;

        if (repoBaseUrl) {
            const cleanBase = repoBaseUrl.replace(/\/$/, '');
            const cleanPath = url.startsWith('/') ? url : `/${url}`;
            return `${cleanBase}${cleanPath}`;
        }
        return url;
    }

    const thumbUrl = getImageUrl(question.contentImgThumb);

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-300 border",
                statusColors[status],
                isDimmed
                    ? "opacity-20 grayscale scale-90 hover:opacity-100 hover:grayscale-0 hover:scale-100"
                    : "opacity-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20"
            )}
            onClick={onClick}
        >
            <CardContent className="p-1.5 flex flex-col items-center justify-center h-16 relative">
                {/* 题号 - 左上角 */}
                <div className="absolute top-1 left-1.5 text-xs font-bold opacity-50">
                    {question.number}
                </div>

                {/* 收藏按钮 - 右上角 (替代原来的笔记位置，笔记移到旁边) */}
                <div
                    className={cn(
                        "absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10",
                        isStarred ? "text-yellow-500" : "text-muted-foreground/20 hover:text-yellow-500/50"
                    )}
                    onClick={handleStarClick}
                    title="收藏题目"
                >
                    <Star className={cn("w-3.5 h-3.5", isStarred && "fill-yellow-500")} />
                </div>

                {/* 缩略图展示 */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {thumbUrl ? (
                        <img
                            src={thumbUrl}
                            alt={`Q${question.number}`}
                            className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-muted-foreground/20 text-lg font-bold select-none">
                            Q{question.number}
                        </div>
                    )}
                </div>

                {/* 笔记指示器 - 移到右下角或者题号旁边 */}
                {hasNote && (
                    <div className="absolute top-1 right-6" title="有笔记">
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
