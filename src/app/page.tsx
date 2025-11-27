"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, PlayCircle, AlertCircle, BookOpen, Trophy, Target } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from "next-themes";

import { DashboardOnboarding } from "@/components/business/DashboardOnboarding";
import { ActivityHeatmap } from "@/components/business/ActivityHeatmap";

export default function DashboardPage() {
  const { total, subjects } = useDashboardStats();
  const { theme } = useTheme();

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
        <Card className="flex-1 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Trophy className="w-64 h-64" />
          </div>
          <CardContent className="p-4 sm:p-8 flex flex-col justify-center h-full relative z-10">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              准备好迎接挑战了吗？
            </h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg max-w-xl">
              保持节奏，每天进步一点点。你已经斩获了 <span className="font-bold text-foreground">{totalMastered}</span> 道真题。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/questions">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-all">
                  <PlayCircle className="w-5 h-5" />
                  继续刷题
                </Button>
              </Link>
              <Link href="/questions?status=unanswered">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 bg-background/50 backdrop-blur-sm">
                  <Target className="w-5 h-5" />
                  今日目标
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 状态卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:w-1/3">
          <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> 已斩题数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{totalMastered}</div>
              <p className="text-xs text-green-600/60 dark:text-green-400/60 mt-1">熟练掌握</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> 需复习
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{totalConfused}</div>
              <p className="text-xs text-yellow-600/60 dark:text-yellow-400/60 mt-1">概念模糊</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> 错题本
              </CardTitle>
              <Link href="/questions?status=failed">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30">
                  去攻克 <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-red-600 dark:text-red-400">{totalFailed}</div>
                <p className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">亟待解决</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 学科进度对比 */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>学科进度分布</CardTitle>
            <CardDescription>
              {activeSubjects.length === 0 ? "暂无题目数据" : "各科目掌握情况概览"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[350px]">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeSubjects}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? '#333' : '#eee'} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: theme === 'dark' ? '#333' : '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="mastered" name="已斩" stackId="a" fill="#16a34a" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="confused" name="懵圈" stackId="a" fill="#eab308" />
                  <Bar dataKey="failed" name="崩盘" stackId="a" fill="#dc2626" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 快速入口 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>专项突破</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activeSubjects.map(subject => (
                <Link
                  key={subject.id}
                  href={`/questions?subject=${subject.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{subject.name}专项</span>
                      <span className="text-xs text-muted-foreground">({subject.total}题)</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
      <div className="mt-8 p-4 border rounded-xl bg-card/50 shadow-sm">
        <ActivityHeatmap />
      </div>
    </div>
  );
}
