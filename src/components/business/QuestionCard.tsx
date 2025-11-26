import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"
import { useProgressStore } from "@/lib/store"
import { PenLine, Star } from "lucide-react"

interface Props {
    question: Question;
    onClick: () => void;
    isDimmed?: boolean;
    height?: number;
    heightMode?: 'fixed' | 'auto';
    compactMode?: boolean;
}

// 状态对应的 Tailwind 颜色类映射
const statusColors: Record<Status, string> = {
    unanswered: "bg-card hover:bg-accent border-border",
    mastered: "bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-900",
    confused: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-900",
    failed: "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-900",
}

export function QuestionCard({ question, onClick, isDimmed = false, height = 64, heightMode = 'fixed', compactMode = false }: Props) {
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

    // 计算 padding：始终为 0 以确保图片贴合
    const getPaddingClass = () => 'p-0';

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-300 border overflow-hidden p-0 gap-0", // 添加 p-0 gap-0 移除默认内边距
                statusColors[status],
                isDimmed
                    ? "opacity-20 grayscale scale-90 hover:opacity-100 hover:grayscale-0 hover:scale-100"
                    : "opacity-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20"
            )}
            onClick={onClick}
        >
            <CardContent
                className={cn(
                    "relative !p-0 !pb-0", // 强制移除所有内边距，包括 last-child 的 pb
                    heightMode === 'auto' ? "h-auto" : ""
                )}
                style={heightMode === 'fixed' ? { height: `${height}px` } : undefined}
            >
                {/* 题号 - 左上角 */}
                <div className="absolute top-1 left-1.5 text-xs font-bold opacity-50 z-10 mix-blend-multiply dark:mix-blend-difference">
                    {question.number}
                </div>

                {/* 收藏按钮 - 右上角 */}
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
                <div className={cn(
                    "w-full overflow-hidden",
                    heightMode === 'fixed' ? "h-full" : ""
                )}>
                    {thumbUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={thumbUrl}
                            alt={`Q${question.number}`}
                            className={cn(
                                "w-full opacity-90 hover:opacity-100 transition-opacity",
                                // 统一使用 object-cover 以填满卡片，裁切掉多余部分
                                heightMode === 'fixed' ? "h-full object-cover" : "h-auto object-cover"
                            )}
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
                    <div className="absolute top-1 right-6 z-10" title="有笔记">
                        <PenLine className="w-3 h-3 text-orange-500/70" />
                    </div>
                )}

                {question.tags.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5 z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
