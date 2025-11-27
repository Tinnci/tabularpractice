import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Target, BarChart2, Sparkles, Cloud, Database, Settings } from "lucide-react";
import { SubjectStat } from "@/hooks/useDashboardStats";

interface Props {
    subjects: SubjectStat[];
}

export function DashboardOnboarding({ subjects }: Props) {
    return (
        <div className="container mx-auto p-6 space-y-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. Welcome Hero */}
            <div className="text-center space-y-6 py-12">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    欢迎来到 TabularPractice
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    您的智能化真题刷题助手。
                    <br />
                    告别盲目题海战术，用数据驱动高效复习。
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Link href="/questions">
                        <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg hover:shadow-xl transition-all">
                            开始刷题 <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 2. Core Features */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                            <Target className="w-6 h-6" />
                        </div>
                        <CardTitle>精准突破</CardTitle>
                        <CardDescription>
                            按年份、按题型、按知识点筛选题目。哪里不会点哪里，构建完整的知识体系。
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <CardTitle>数据追踪</CardTitle>
                        <CardDescription>
                            自动生成进度热力图和学科分布图。实时掌握复习进度，拒绝假努力。
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 text-orange-600 dark:text-orange-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <CardTitle>沉浸体验</CardTitle>
                        <CardDescription>
                            支持 Markdown 笔记、一键跳转 B 站视频讲解。打造最舒适的刷题环境。
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
                        <CardTitle>数据安全</CardTitle>
                        <CardDescription>
                            支持 GitHub Gist 云同步，多设备无缝切换。数据永不丢失，刷题更安心。
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-2 text-pink-600 dark:text-pink-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <CardTitle>无限扩展</CardTitle>
                        <CardDescription>
                            开放题库生态。通过设置添加自定义题库源，英语、政治、专业课一网打尽。
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                            <Settings className="w-6 h-6" />
                        </div>
                        <CardTitle>为你而设</CardTitle>
                        <CardDescription>
                            无论是大屏复习还是碎片时间刷题，完全可自定义的卡片布局与省流模式助你专注。
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* 3. Quick Start Subjects */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold border-l-4 border-primary pl-3">
                    选择科目开始
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(subject => (
                        <Link key={subject.id} href={`/questions?subject=${subject.id}`} className="group">
                            <Card className="h-full hover:shadow-md transition-all border-muted hover:border-primary/50 cursor-pointer group-hover:-translate-y-1">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                            {subject.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            共 {subject.total} 道真题
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {subjects.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                            正在加载题库数据...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
