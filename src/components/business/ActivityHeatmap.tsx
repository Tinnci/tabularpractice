"use client";

import { useProgressStore } from "@/lib/store";
import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DICT } from "@/lib/i18n";
import dynamic from "next/dynamic";

const ActivityCalendar = dynamic(
    () => import('react-activity-calendar').then(mod => mod.ActivityCalendar),
    { ssr: false }
);

import { ClientOnly } from "@/components/ui/ClientOnly";
// ... imports

export function ActivityHeatmap() {
    const history = useProgressStore(state => state.history);

    // Removed manual mounted state
    // const [mounted, setMounted] = useState(false);
    // useEffect ...

    // 转换数据格式适配 react-activity-calendar
    const data = useMemo(() => {
        // ... (same logic)
        if (!history || Object.keys(history).length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return [{ date: today, count: 0, level: 0 }];
        }

        const rawData = Object.entries(history).map(([date, count]) => {
            let level = 0;
            if (count === 0) level = 0;
            else if (count <= 5) level = 1;
            else if (count <= 15) level = 2;
            else if (count <= 30) level = 3;
            else level = 4;

            return { date, count, level };
        });

        // 排序
        return rawData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [history]);

    // 计算连续打卡天数 (Streak)
    const streak = useMemo(() => {
        if (!history) return 0;
        const today = new Date().toISOString().split('T')[0];
        let currentStreak = 0;
        const checkDate = new Date(today);

        // 检查今天是否有数据
        if ((history[today] || 0) > 0) {
            currentStreak++;
        }

        // 往前倒推
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const dateStr = checkDate.toISOString().split('T')[0];
            if ((history[dateStr] || 0) > 0) {
                currentStreak++;
            } else {
                break;
            }
        }
        return currentStreak;
    }, [history]);

    // 计算过去一年总题数
    const totalYearly = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.count, 0);
    }, [data]);

    const loadingSkeleton = (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">{DICT.heatmap.title}</h3>
                <div className="text-xs text-muted-foreground space-x-4">
                    <span>{DICT.heatmap.yearlyTotal}: <span className="font-bold text-foreground">--</span> 题</span>
                    <span>{DICT.heatmap.streak}: <span className="font-bold text-green-600 dark:text-green-400">--</span> 天</span>
                </div>
            </div>
            <div className="w-full h-[120px] bg-muted/20 rounded animate-pulse" />
        </div>
    );

    return (
        <ClientOnly fallback={loadingSkeleton}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">
                        {DICT.heatmap.title}
                    </h3>
                    <div className="text-xs text-muted-foreground space-x-4">
                        <span>{DICT.heatmap.yearlyTotal}: <span className="font-bold text-foreground">{totalYearly}</span> 题</span>
                        <span>{DICT.heatmap.streak}: <span className="font-bold text-green-600 dark:text-green-400">{streak}</span> 天</span>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-2">
                    <div className="min-w-[600px]"> {/* 保证在小屏上也能完整显示 */}
                        <ActivityCalendar
                            data={data}
                            theme={{
                                light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                                dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                            }}
                            labels={{
                                legend: {
                                    less: DICT.heatmap.lesserActivity,
                                    more: DICT.heatmap.moreActivity,
                                },
                                months: [...DICT.heatmap.months],
                                totalCount: DICT.heatmap.questionsInYear,
                                weekdays: [...DICT.heatmap.weekdays]
                            }}
                            renderBlock={(block, activity) => (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            {React.cloneElement(block as React.ReactElement<{ className?: string, style?: React.CSSProperties }>, {
                                                className: cn(
                                                    "transition-all duration-200 ease-in-out origin-center hover:scale-125 hover:z-10 cursor-pointer",
                                                    // 可选：给有数据的格子加一点阴影，强调“成就感”
                                                    activity.count > 0 ? "hover:drop-shadow-sm" : ""
                                                ),
                                                // 修复：SVG 变换可能需要 specific style 覆盖
                                                style: { ...block.props.style, transformBox: 'fill-box' }
                                            })}
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs font-mono">
                                            {activity.date}: {activity.count} 题
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            blockSize={10}
                            blockRadius={2}
                            blockMargin={4}
                            fontSize={12}
                            showWeekdayLabels
                        />
                    </div>
                </div>
            </div>
        </ClientOnly>
    );
}
