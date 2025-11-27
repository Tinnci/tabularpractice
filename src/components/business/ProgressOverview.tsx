"use client";

import { useProgressStore } from "@/lib/store";
import { Question, Status } from "@/lib/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

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
            <CardHeader className="p-0 mb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>当前进度</span>
                    <span className="text-[10px] font-normal opacity-70">{total} 题</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
                {/* 1. 紧凑型分段进度条 (Rounded Rectangle Line) */}
                <div className="h-3 w-full flex rounded-full overflow-hidden bg-muted/30">
                    {/* 已斩 */}
                    <div
                        className={cn("h-full bg-green-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'mastered' && "brightness-110")}
                        style={{ width: `${(stats.mastered / total) * 100}%` }}
                        onClick={() => handleFilterClick('mastered')}
                        title={`已斩: ${stats.mastered}`}
                    />
                    {/* 懵圈 */}
                    <div
                        className={cn("h-full bg-yellow-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'confused' && "brightness-110")}
                        style={{ width: `${(stats.confused / total) * 100}%` }}
                        onClick={() => handleFilterClick('confused')}
                        title={`懵圈: ${stats.confused}`}
                    />
                    {/* 崩盘 */}
                    <div
                        className={cn("h-full bg-red-500 transition-all cursor-pointer hover:opacity-80", filterStatus === 'failed' && "brightness-110")}
                        style={{ width: `${(stats.failed / total) * 100}%` }}
                        onClick={() => handleFilterClick('failed')}
                        title={`崩盘: ${stats.failed}`}
                    />
                    {/* 剩余 (透明/背景色) */}
                    <div
                        className={cn("h-full bg-muted transition-all cursor-pointer hover:opacity-80", filterStatus === 'unanswered' && "bg-muted-foreground/20")}
                        style={{ width: `${(stats.unanswered / total) * 100}%` }}
                        onClick={() => handleFilterClick('unanswered')}
                        title={`未做: ${stats.unanswered}`}
                    />
                </div>

                {/* 2. 紧凑型数据统计 (一行显示) */}
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
            </CardContent>
        </Card>
    );
}
