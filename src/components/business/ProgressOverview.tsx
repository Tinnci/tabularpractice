"use client";

import { useProgressStore } from "@/lib/store";
import { Question, Status } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// Dynamically import Recharts to prevent SSR issues
const ResponsiveContainer = dynamic(
    () => import('recharts').then(mod => mod.ResponsiveContainer),
    { ssr: false }
);
const PieChart = dynamic(
    () => import('recharts').then(mod => mod.PieChart),
    { ssr: false }
);
const Pie = dynamic(
    () => import('recharts').then(mod => mod.Pie),
    { ssr: false }
);
const Cell = dynamic(
    () => import('recharts').then(mod => mod.Cell),
    { ssr: false }
);
const RechartsTooltip = dynamic(
    () => import('recharts').then(mod => mod.Tooltip),
    { ssr: false }
);

export function ProgressOverview({ questions }: { questions: Question[] }) {
    const { theme } = useTheme();
    const progressStore = useProgressStore();
    const { progress, setFilterStatus, filterStatus } = progressStore;

    // 2. 处理 Hydration Mismatch: 确保只在客户端渲染
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 3. 基于传入的 questions 计算统计数据 (上下文感知)
    const stats = useMemo(() => {
        let mastered = 0;
        let confused = 0;
        let failed = 0;
        let unanswered = 0;

        questions.forEach(q => {
            const status = progress[q.id];
            if (status === 'mastered') mastered++;
            else if (status === 'confused') confused++;
            else if (status === 'failed') failed++;
            else unanswered++;
        });

        return { mastered, confused, failed, unanswered };
    }, [questions, progress]);

    const total = questions.length;

    const data = useMemo(() => [
        { name: '斩 (熟练)', value: stats.mastered, color: theme === 'dark' ? '#22c55e' : '#16a34a', status: 'mastered' },
        { name: '懵 (不熟)', value: stats.confused, color: theme === 'dark' ? '#facc15' : '#eab308', status: 'confused' },
        { name: '崩 (不会)', value: stats.failed, color: theme === 'dark' ? '#f87171' : '#dc2626', status: 'failed' },
        { name: '未做', value: stats.unanswered, color: theme === 'dark' ? '#334155' : '#e2e8f0', status: 'unanswered' },
    ], [stats, theme]);

    const progressPercentage = total > 0
        ? Math.round(((stats.mastered + stats.confused + stats.failed) / total) * 100)
        : 0;

    const handleFilterClick = (status: string) => {
        // 映射 status 字符串到 Status 类型或 'all'/'unanswered'
        // 注意：这里 status 来自 data 中的 status 字段

        // 如果当前已经选中了该状态，则取消筛选 (重置为 'all')
        // 注意：我们需要获取当前的 filterStatus。由于它在 store 中，我们已经在组件开头解构了。
        // 但是我们需要确保 status 字符串与 store 中的 filterStatus 类型匹配。
        // store 中的 filterStatus 类型是 Status | 'all' | 'unanswered'

        const targetStatus = status === 'unanswered' ? 'unanswered' : status as Status;

        if (progressStore.filterStatus === targetStatus) {
            setFilterStatus('all');
        } else {
            setFilterStatus(targetStatus);
        }
    };

    // 如果未挂载，返回一个占位符或空内容，避免服务端渲染不匹配
    if (!mounted) {
        return (
            <Card className="w-full border-none shadow-none bg-transparent opacity-0">
                <CardContent className="p-0 h-24" />
            </Card>
        );
    }

    return (
        <Card className="w-full border-none shadow-none bg-transparent">
            <CardHeader className="p-0 mb-1.5 md:mb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>当前进度</span>
                    <span className="text-[10px] font-normal opacity-70">{total} 题</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* 1. 移动端/窄屏：紧凑型分段进度条 (md:hidden) */}
                <div className="md:hidden space-y-1.5">
                    <div className="h-2 w-full flex rounded-full overflow-hidden bg-muted/30">
                        {/* 已斩 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("h-full bg-green-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'mastered' && "brightness-110")}
                                    style={{ width: `${(stats.mastered / total) * 100}%` }}
                                    onClick={() => handleFilterClick('mastered')}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>已斩: {stats.mastered} ({Math.round((stats.mastered / total) * 100)}%)</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 懵圈 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("h-full bg-yellow-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'confused' && "brightness-110")}
                                    style={{ width: `${(stats.confused / total) * 100}%` }}
                                    onClick={() => handleFilterClick('confused')}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>懵圈: {stats.confused} ({Math.round((stats.confused / total) * 100)}%)</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 崩盘 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("h-full bg-red-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'failed' && "brightness-110")}
                                    style={{ width: `${(stats.failed / total) * 100}%` }}
                                    onClick={() => handleFilterClick('failed')}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>崩盘: {stats.failed} ({Math.round((stats.failed / total) * 100)}%)</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 剩余 (透明/背景色) */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("h-full bg-muted transition-all cursor-pointer hover:opacity-80", filterStatus === 'unanswered' && "bg-muted-foreground/20")}
                                    style={{ width: `${(stats.unanswered / total) * 100}%` }}
                                    onClick={() => handleFilterClick('unanswered')}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>未做: {stats.unanswered} ({Math.round((stats.unanswered / total) * 100)}%)</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 紧凑型数据统计 */}
                    <div className="flex items-center justify-between text-xs">
                        <div
                            className={cn("flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors", filterStatus === 'mastered' ? "text-green-600 font-bold" : "text-muted-foreground")}
                            onClick={() => handleFilterClick('mastered')}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span>{stats.mastered}</span>
                        </div>
                        <div
                            className={cn("flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors", filterStatus === 'confused' ? "text-yellow-600 font-bold" : "text-muted-foreground")}
                            onClick={() => handleFilterClick('confused')}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            <span>{stats.confused}</span>
                        </div>
                        <div
                            className={cn("flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors", filterStatus === 'failed' ? "text-red-600 font-bold" : "text-muted-foreground")}
                            onClick={() => handleFilterClick('failed')}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>{stats.failed}</span>
                        </div>
                        <div
                            className={cn("flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors", filterStatus === 'unanswered' ? "text-foreground font-bold" : "text-muted-foreground")}
                            onClick={() => handleFilterClick('unanswered')}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                            <span>{stats.unanswered}</span>
                        </div>
                    </div>
                </div>

                {/* 2. 桌面端/宽屏：环形图 (hidden md:flex) */}
                <div className="hidden md:flex items-center gap-4">
                    {/* 环形图 */}
                    <div className="h-24 w-24 relative flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105" title="点击筛选">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={22}
                                    outerRadius={36}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    onClick={(data) => handleFilterClick(data.status)}
                                >
                                    {data.map((entry, index) => {
                                        const isActive = filterStatus === entry.status;
                                        const isDimmed = filterStatus !== 'all' && !isActive;

                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                cursor="pointer"
                                                opacity={isDimmed ? 0.3 : 1}
                                                stroke={isActive ? theme === 'dark' ? '#fff' : '#000' : 'none'}
                                                strokeWidth={isActive ? 2 : 0}
                                            />
                                        );
                                    })}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontSize: '12px',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* 中心文字 */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-lg font-bold text-foreground">{progressPercentage}%</span>
                            <span className="text-[10px] text-muted-foreground -mt-0.5">已刷</span>
                        </div>
                    </div>

                    {/* 文字详情 */}
                    <div className="grid grid-cols-1 gap-y-1.5 text-xs flex-1 min-w-0">
                        <div
                            className={cn(
                                "flex items-center justify-between cursor-pointer rounded px-1 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-muted/80 group",
                                filterStatus === 'mastered' && "bg-muted font-medium"
                            )}
                            onClick={() => handleFilterClick('mastered')}
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500 shrink-0" />
                                <span className="text-muted-foreground group-hover:text-foreground truncate">已斩</span>
                            </div>
                            <span className="font-mono font-bold text-foreground ml-1">{stats.mastered}</span>
                        </div>
                        <div
                            className={cn(
                                "flex items-center justify-between cursor-pointer rounded px-1 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-muted/80 group",
                                filterStatus === 'confused' && "bg-muted font-medium"
                            )}
                            onClick={() => handleFilterClick('confused')}
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400 shrink-0" />
                                <span className="text-muted-foreground group-hover:text-foreground truncate">懵圈</span>
                            </div>
                            <span className="font-mono font-bold text-foreground ml-1">{stats.confused}</span>
                        </div>
                        <div
                            className={cn(
                                "flex items-center justify-between cursor-pointer rounded px-1 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-muted/80 group",
                                filterStatus === 'failed' && "bg-muted font-medium"
                            )}
                            onClick={() => handleFilterClick('failed')}
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 shrink-0" />
                                <span className="text-muted-foreground group-hover:text-foreground truncate">崩盘</span>
                            </div>
                            <span className="font-mono font-bold text-foreground ml-1">{stats.failed}</span>
                        </div>
                        <div
                            className={cn(
                                "flex items-center justify-between pt-1 border-t border-border cursor-pointer rounded px-1 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-muted/80 group",
                                filterStatus === 'unanswered' && "bg-muted font-medium"
                            )}
                            onClick={() => handleFilterClick('unanswered')}
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full bg-muted shrink-0" />
                                <span className="text-muted-foreground group-hover:text-foreground truncate">剩余</span>
                            </div>
                            <span className="font-mono font-bold text-muted-foreground ml-1">{stats.unanswered}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
