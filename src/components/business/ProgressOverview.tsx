"use client";

import { useProgressStore } from "@/lib/store";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useEffect, useState } from "react";

export function ProgressOverview({ total }: { total: number }) {
    // 1. 只订阅 progress 数据的变化，避免无限循环
    const progress = useProgressStore(state => state.progress);

    // 2. 处理 Hydration Mismatch: 确保只在客户端渲染
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 3. 在组件内部计算统计数据
    const stats = useMemo(() => {
        const values = Object.values(progress);
        return {
            mastered: values.filter(s => s === 'mastered').length,
            confused: values.filter(s => s === 'confused').length,
            failed: values.filter(s => s === 'failed').length,
        };
    }, [progress]);

    const data = useMemo(() => [
        { name: '斩 (熟练)', value: stats.mastered, color: '#16a34a' }, // green-600
        { name: '懵 (不熟)', value: stats.confused, color: '#eab308' }, // yellow-500
        { name: '崩 (不会)', value: stats.failed, color: '#dc2626' },   // red-600
        { name: '未做', value: Math.max(0, total - (stats.mastered + stats.confused + stats.failed)), color: '#e2e8f0' }, // slate-200
    ], [stats, total]);

    const progressPercentage = total > 0
        ? Math.round(((stats.mastered + stats.confused + stats.failed) / total) * 100)
        : 0;

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
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    刷题进度
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center gap-6">
                {/* 环形图 */}
                <div className="h-24 w-24 relative flex-shrink-0">
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
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* 中心文字 */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-lg font-bold text-slate-700">{progressPercentage}%</span>
                        <span className="text-[10px] text-slate-400 -mt-0.5">已刷</span>
                    </div>
                </div>

                {/* 文字详情 */}
                <div className="grid grid-cols-1 gap-y-1.5 text-xs flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            <span className="text-slate-600">已斩</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{stats.mastered}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-slate-600">懵圈</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{stats.confused}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-slate-600">崩盘</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{stats.failed}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="text-slate-400">剩余</span>
                        </div>
                        <span className="font-mono font-bold text-slate-400">{data[3].value}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
