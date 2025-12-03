import { Card, CardContent } from "@/components/ui/card"
import { memo } from 'react';
import { cn } from "@/lib/utils"
import { Question, Status } from "@/lib/types"
import { useProgressStore } from "@/lib/store"
import { PenLine, Star } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

// 悬停时的光晕效果映射
const hoverGlows: Record<Status, string> = {
    unanswered: "hover:shadow-[0_8px_20px_-4px_rgba(var(--foreground),0.1)] hover:border-primary/30",
    mastered: "hover:shadow-[0_8px_20px_-4px_rgba(34,197,94,0.25)] hover:border-green-500/50 dark:hover:shadow-[0_8px_20px_-4px_rgba(34,197,94,0.15)]",
    confused: "hover:shadow-[0_8px_20px_-4px_rgba(234,179,8,0.25)] hover:border-yellow-500/50 dark:hover:shadow-[0_8px_20px_-4px_rgba(234,179,8,0.15)]",
    failed: "hover:shadow-[0_8px_20px_-4px_rgba(239,68,68,0.25)] hover:border-red-500/50 dark:hover:shadow-[0_8px_20px_-4px_rgba(239,68,68,0.15)]",
}

export const QuestionCard = memo(function QuestionCard({ question, onClick, isDimmed = false, height = 64, heightMode = 'fixed' }: Props) {
    const status = question.status || 'unanswered';

    // 性能优化：使用细粒度的 Selector 避免全量订阅导致的渲染风暴
    const hasNote = useProgressStore(state => !!state.notes[question.id]);
    const isStarred = useProgressStore(state => !!state.stars[question.id]);
    const toggleStar = useProgressStore(state => state.toggleStar);
    const repoBaseUrl = useProgressStore(state => state.repoBaseUrl);
    const repoSources = useProgressStore(state => state.repoSources);

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
                // 引入新的光晕效果
                !isDimmed && hoverGlows[status],

                isDimmed
                    ? "opacity-20 grayscale scale-90 hover:opacity-100 hover:grayscale-0 hover:scale-100"
                    : "opacity-100 shadow-sm hover:-translate-y-1" // 加大一点上浮距离 (-0.5 -> -1)
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
                    className={cn(
                        "absolute rounded-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-[2px] px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm z-20 border border-white/20 select-none",
                        // 新增动画类：
                        // 1. transition-all duration-300
                        // 2. group-hover:scale-110: 整体微微变大
                        // 3. group-hover:bg-white: 变亮 (去掉透明度)
                        // 4. group-hover:shadow-md: 增加投影，产生悬浮感
                        "transition-all duration-300 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    )}
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
                <Tooltip>
                    <TooltipTrigger asChild>
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
                        >
                            <Star className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", isStarred ? "fill-yellow-500 text-yellow-500" : "text-slate-400 dark:text-slate-500")} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>收藏题目</p>
                    </TooltipContent>
                </Tooltip>

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
                                // 1. 修改 transition 属性：从 transition-opacity 改为 transition-all
                                // 2. 增加 duration-500 ease-in-out：让动画更缓慢、平滑
                                // 3. 增加 group-hover:scale-110：悬停时放大 10%
                                "w-full opacity-90 transition-all duration-500 ease-in-out dark:invert group-hover:scale-110 group-hover:opacity-100",
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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-1 right-6 z-10">
                                <PenLine className="w-3 h-3 text-orange-500/70" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>有笔记</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {question.tags.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5 z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
});
