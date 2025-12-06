"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, PlayCircle, AlertCircle, BookOpen, Trophy, Target } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DICT } from "@/lib/i18n";

import { DashboardOnboarding } from "@/components/business/DashboardOnboarding";
import { ActivityHeatmap } from "@/components/business/ActivityHeatmap";
import { useProgressStore } from "@/lib/store";

// Dynamically import Recharts to prevent SSR issues
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
);

export default function DashboardPage() {
  const { total, subjects } = useDashboardStats();
  const { resolvedTheme } = useTheme();
  const lastQuestionId = useProgressStore(state => state.lastQuestionId);

  // Prevent SSR issues with Recharts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 图表颜色配置 - 根据主题自动调整
  const chartColors = {
    mastered: resolvedTheme === 'dark' ? '#4ade80' : '#22c55e',  // 绿色：深色模式更亮
    confused: resolvedTheme === 'dark' ? '#fbbf24' : '#f59e0b',  // 橙黄：提高对比度
    failed: resolvedTheme === 'dark' ? '#f87171' : '#ef4444',    // 红色：深色模式更柔和
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    cursor: resolvedTheme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(244, 244, 245, 0.8)',
  };

  // 1. 生成图表数据
  // 过滤掉题目数为 0 的科目
  const activeSubjects = subjects.filter(s => s.total > 0);

  const totalMastered = total.mastered;
  const totalFailed = total.failed;
  const totalConfused = total.confused;
  const totalAnswered = totalMastered + totalFailed + totalConfused;

  // 如果是新用户（还未开始刷题），显示引导页
  if (totalAnswered === 0 && activeSubjects.length > 0) {
    return <DashboardOnboarding subjects={activeSubjects} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* 1. Hero Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/10 relative overflow-hidden shadow-xl shadow-primary/5 group hover:shadow-primary/10 transition-all duration-500">
          {/* 装饰背景元素 */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="absolute top-10 right-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 transform group-hover:scale-110 group-hover:rotate-6">
            <Trophy className="w-64 h-64" />
          </div>

          <CardContent className="p-6 sm:p-10 flex flex-col justify-center h-full relative z-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {DICT.dashboard.challengeTitle}
            </h1>
            <p className="text-muted-foreground/80 mb-8 sm:mb-10 text-lg sm:text-xl max-w-xl leading-relaxed">
              {DICT.dashboard.challengeDesc.replace("{count}", totalMastered.toString())}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={lastQuestionId ? `/questions?questionId=${lastQuestionId}` : "/questions"}>
                <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300 rounded-full">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  {lastQuestionId ? DICT.dashboard.continuePractice : DICT.dashboard.startPractice}
                </Button>
              </Link>
              <Link href="/questions?status=unanswered">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-background/80 border-primary/20 hover:border-primary/40 rounded-full transition-all duration-300">
                  <Target className="w-5 h-5 mr-2" />
                  {DICT.dashboard.dailyTarget}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 状态卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:w-1/3">
          <Card className="glass-card border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/10 to-transparent dark:from-green-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-500" /> {DICT.dashboard.masteredLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{totalMastered}</div>
              <p className="text-xs text-muted-foreground mt-1">{DICT.dashboard.masteredDesc}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50/10 to-transparent dark:from-yellow-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-yellow-500" /> {DICT.dashboard.confusedLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{totalConfused}</div>
              <p className="text-xs text-muted-foreground mt-1">{DICT.dashboard.confusedDesc}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-red-500 col-span-2 bg-gradient-to-br from-red-50/10 to-transparent dark:from-red-900/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> {DICT.dashboard.failedLabel}
              </CardTitle>
              <Link href="/mistakes">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full">
                  开始复习 <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-red-600 dark:text-red-400">{totalFailed + totalConfused}</div>
                <p className="text-xs text-muted-foreground mt-1">{DICT.dashboard.failedDesc}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 学科进度对比 */}
        <Card className="glass-card col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{DICT.dashboard.subjectProgress}</CardTitle>
            <CardDescription>
              {activeSubjects.length === 0 ? DICT.dashboard.noDataDesc : DICT.dashboard.subjectProgressDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[350px]">
            <div className="h-full w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart
                    data={activeSubjects}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={chartColors.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: chartColors.cursor }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        backgroundColor: resolvedTheme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="mastered" name={DICT.progress.masteredShort} stackId="a" fill={chartColors.mastered} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="confused" name={DICT.progress.confusedShort} stackId="a" fill={chartColors.confused} />
                    <Bar dataKey="failed" name={DICT.progress.failedShort} stackId="a" fill={chartColors.failed} radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-muted/20 rounded animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 快速入口 */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle>{DICT.dashboard.specialAttack}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activeSubjects.map(subject => (
                <Link
                  key={subject.id}
                  href={`/questions?subject=${subject.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-transparent bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                      <span className="font-medium group-hover:text-primary transition-colors">{subject.name}专项</span>
                      <span className="text-xs text-muted-foreground">({subject.total}题)</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}

              {activeSubjects.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  还没有添加任何题目
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部：热力图 */}
      <div className="mt-8 p-6 border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  );
}
