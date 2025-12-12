import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart2, BookOpen, Cloud, Database, Settings, Target } from "lucide-react";
import { type SubjectStat } from "@/hooks/useDashboardStats";

interface Props {
    subjects: SubjectStat[];
}

import { useProgressStore } from "@/lib/store";
import { DICT } from "@/lib/i18n";

export function DashboardOnboarding({ subjects }: Props) {
    const lastQuestionId = useProgressStore(state => state.lastQuestionId);

    return (
        <div className="container mx-auto p-6 space-y-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. Welcome Hero */}
            <div className="text-center space-y-6 py-12">

                {/* 匹配 Navbar 的 Logo - 放大版 */}
                <div className="flex justify-center mb-8">
                    <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 hover:rotate-6 transition-all duration-500 hover:scale-105">
                        <span className="text-primary-foreground font-bold text-4xl tracking-tighter">TP</span>
                    </div>
                </div>

                {/* 匹配 Navbar 的文字风格 - 放大版 */}
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                    {DICT.onboarding.title}<span className="font-light text-muted-foreground">{DICT.onboarding.subtitle}</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {DICT.onboarding.heroP1}
                    <br />
                    {DICT.onboarding.heroP2}
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Link href={lastQuestionId ? `/questions?questionId=${lastQuestionId}` : "/questions"}>
                        <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg hover:shadow-xl transition-all">
                            {lastQuestionId ? DICT.onboarding.continue : DICT.onboarding.start} <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 2. Core Features */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass-card border-primary/5 hover:border-primary/20 group">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Target className="w-6 h-6" />
                        </div>
                        <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{DICT.onboarding.features.precise}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.preciseDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-primary/5 hover:border-primary/20 group">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <CardTitle className="group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{DICT.onboarding.features.tracking}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.trackingDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-primary/5 hover:border-primary/20 group">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <CardTitle className="group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{DICT.onboarding.features.immersive}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.immersiveDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* 2.1 Advanced Features (Settings Highlights) */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 text-purple-600 dark:text-purple-400">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <CardTitle>{DICT.onboarding.features.security}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.securityDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-2 text-pink-600 dark:text-pink-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <CardTitle>{DICT.onboarding.features.extensible}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.extensibleDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                            <Settings className="w-6 h-6" />
                        </div>
                        <CardTitle>{DICT.onboarding.features.custom}</CardTitle>
                        <CardDescription>
                            {DICT.onboarding.features.customDesc}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* 3. Quick Start Subjects */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold border-l-4 border-primary pl-3">
                    {DICT.onboarding.selectSubject}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(subject => (
                        <Link key={subject.id} href={`/questions?subject=${subject.id}`} className="group">
                            <Card className="glass-card h-full cursor-pointer hover:-translate-y-1 hover:border-primary/30 transition-all duration-300">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                            {subject.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {DICT.onboarding.totalCount.replace("{count}", String(subject.total))}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-300 shadow-sm">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {subjects.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                            {DICT.onboarding.loading}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
