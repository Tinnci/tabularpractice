"use client";

import { useProgressStore } from "@/lib/store";
import { Question } from "@/lib/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";

export function ProgressOverview({ questions }: { questions: Question[] }) {
    const { theme } = useTheme();
    const { progress, setFilterStatus } = useProgressStore();

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
        if (status === 'unanswered') {
            setFilterStatus('unanswered');
        } else {
            setFilterStatus(status as any);
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
            <CardHeader className="p-0 mb-3">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>当前进度</span>
                    <span className="text-[10px] font-normal opacity-70">{total} 题</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center gap-6">
                {/* 环形图 */}
                <div className="h-24 w-24 relative flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity" title="点击筛选">
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
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
                                ))}
                            </Pie>
                            <Tooltip
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

                {/* 文字详情 - 可点击筛选 */}
                <div className="grid grid-cols-1 gap-y-1.5 text-xs flex-1">
                    <div
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group"
                        onClick={() => handleFilterClick('mastered')}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500" />
                            <span className="text-muted-foreground group-hover:text-foreground">已斩</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">{stats.mastered}</span>
                    </div>
                    <div
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group"
                        onClick={() => handleFilterClick('confused')}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400" />
                            <span className="text-muted-foreground group-hover:text-foreground">懵圈</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">{stats.confused}</span>
                    </div>
                    <div
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group"
                        onClick={() => handleFilterClick('failed')}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400" />
                            <span className="text-muted-foreground group-hover:text-foreground">崩盘</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">{stats.failed}</span>
                    </div>
                    <div
                        className="flex items-center justify-between pt-1 border-t border-border cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group"
                        onClick={() => handleFilterClick('unanswered')}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-muted" />
                            <span className="text-muted-foreground group-hover:text-foreground">剩余</span>
                        </div>
                        <span className="font-mono font-bold text-muted-foreground">{stats.unanswered}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
