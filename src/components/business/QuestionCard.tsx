import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"
import { useProgressStore } from "@/lib/store"
import { PenLine, Star } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

interface Props {
    question: Question;
    onClick: () => void;
    isDimmed?: boolean;
    height?: number;
    heightMode?: 'fixed' | 'auto';
}

// 状态对应的 Tailwind 颜色类映射
const statusColors: Record<Status, string> = {
    unanswered: "bg-card hover:bg-accent border-border",
    mastered: "bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-900",
    confused: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-900",
    failed: "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-900",
}

export function QuestionCard({ question, onClick, isDimmed = false, height = 64, heightMode = 'fixed' }: Props) {
    const status = question.status || 'unanswered';
    const { notes, stars, toggleStar, repoBaseUrl, repoSources } = useProgressStore();
    const hasNote = !!notes[question.id];
    const isStarred = !!stars[question.id];

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleStar(question.id);
    };

    const thumbUrl = getImageUrl(question.contentImgThumb, question, repoBaseUrl, repoSources);

    // 动态计算 UI 缩放比例，确保在不同高度下协调
    // 基准高度设为 160px，最小缩放 0.6
    const uiScale = heightMode === 'fixed' ? Math.max(0.6, Math.min(1, height / 160)) : 1;

    return (
        <Card
            className={cn(
                "group cursor-pointer transition-all duration-300 border overflow-hidden p-0 gap-0",
                statusColors[status],
                isDimmed
                    ? "opacity-20 grayscale scale-90 hover:opacity-100 hover:grayscale-0 hover:scale-100"
                    : "opacity-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20"
            )}
            onClick={onClick}
        >
            <CardContent
                className={cn(
                    "relative !p-0 !pb-0",
                    heightMode === 'auto' ? "h-auto" : ""
                )}
                style={heightMode === 'fixed' ? { height: `${height}px` } : undefined}
            >
                {/* 题号 - Glassmorphism 胶囊样式 */}
                <div
                    className="absolute rounded-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-[2px] px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm z-20 border border-white/20 select-none"
                    style={{
                        top: '4%',
                        left: '4%',
                        transform: `scale(${uiScale})`,
                        transformOrigin: 'top left'
                    }}
                >
                    {question.number}
                </div>

                {/* 收藏按钮 - Glassmorphism 圆形 */}
                <div
                    className={cn(
                        "absolute p-1 rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-[2px] shadow-sm z-20 transition-all duration-200 border border-white/20 cursor-pointer",
                        "hover:scale-110 hover:bg-white dark:hover:bg-black",
                        isStarred ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                    )}
                    style={{
                        top: '4%',
                        right: '4%',
                        transform: `scale(${uiScale})`,
                        transformOrigin: 'top right'
                    }}
                    onClick={handleStarClick}
                    title="收藏题目"
                >
                    <Star className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", isStarred ? "fill-yellow-500 text-yellow-500" : "text-slate-400 dark:text-slate-500")} />
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
                                "w-full opacity-90 hover:opacity-100 transition-opacity dark:invert",
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

                {/* 笔记指示器 */}
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
