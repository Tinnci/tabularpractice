import { useProgressStore } from "@/lib/store";
import ActivityCalendar from "react-activity-calendar";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ActivityHeatmap() {
    const history = useProgressStore(state => state.history);

    // 转换数据格式适配 react-activity-calendar
    const data = useMemo(() => {
        // 如果没有历史数据，至少生成今天的空数据，防止报错或显示异常
        if (!history || Object.keys(history).length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return [{ date: today, count: 0, level: 0 }];
        }

        // 填充过去一年的每一天？react-activity-calendar 会自动处理
        // 我们只需要把 history 对象转为数组
        const rawData = Object.entries(history).map(([date, count]) => {
            // 计算等级 (0-4)
            let level = 0;
            if (count === 0) level = 0;
            else if (count <= 5) level = 1;
            else if (count <= 15) level = 2;
            else if (count <= 30) level = 3;
            else level = 4;

            return {
                date,
                count,
                level
            };
        });

        // 排序
        return rawData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [history]);

    // 计算连续打卡天数 (Streak)
    const streak = useMemo(() => {
        if (!history) return 0;

        const today = new Date().toISOString().split('T')[0];
        let currentStreak = 0;
        let checkDate = new Date(today);

        // 检查今天是否有数据
        if ((history[today] || 0) > 0) {
            currentStreak++;
        } else {
            // 如果今天没做，检查昨天
            // checkDate.setDate(checkDate.getDate() - 1);
            // 如果今天还没做，streak 可能是 0，或者基于昨天的连续？
            // 通常逻辑：如果今天没做，streak 显示昨天的连续值，但如果昨天也没做，就断了。
            // 简单起见：从昨天开始往前倒推
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                    奋斗热力图
                </h3>
                <div className="text-xs text-muted-foreground space-x-4">
                    <span>年度总计: <span className="font-bold text-foreground">{totalYearly}</span> 题</span>
                    <span>连续打卡: <span className="font-bold text-green-600 dark:text-green-400">{streak}</span> 天</span>
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
                                less: '少',
                                more: '多',
                            },
                            months: [
                                '1月', '2月', '3月', '4月', '5月', '6月',
                                '7月', '8月', '9月', '10月', '11月', '12月'
                            ],
                            totalCount: '{{count}} 题 (过去一年)',
                            weekdays: [
                                '周日', '周一', '周二', '周三', '周四', '周五', '周六'
                            ]
                        }}
                        renderBlock={(block, activity) => (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {block}
                                    </TooltipTrigger>
                                    <TooltipContent>
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
    );
}
