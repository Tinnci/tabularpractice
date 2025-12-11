"use client";

import { useState } from "react";
import { usePapers } from "@/hooks/usePapers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Book,
    FileText,
    LayoutGrid,
    Search,
    Github,
    Database,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { DICT } from "@/lib/i18n";

export default function ManagePage() {
    const { papers, isLoading } = usePapers();
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
    const { githubToken, repoSources } = useProgressStore();

    // Group papers by category/year for the sidebar
    // This is a simplified version; real implementation would use subjectConfig

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        题库管理
                    </span>
                    <ModeToggle />
                </div>

                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={DICT.nav.searchPlaceholder} className="pl-8" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="p-4 text-sm text-muted-foreground text-center">{DICT.common.loading}</div>
                        ) : papers?.map(paper => (
                            <Button
                                key={paper.id}
                                variant={selectedPaperId === paper.id ? "secondary" : "ghost"}
                                className="w-full justify-start text-sm font-normal"
                                onClick={() => setSelectedPaperId(paper.id)}
                            >
                                <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="truncate flex-1 text-left">{paper.name}</span>
                                {paper.sourceUrl?.includes('github') && (
                                    <Github className="w-3 h-3 text-muted-foreground/50" />
                                )}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", githubToken ? "bg-green-500" : "bg-yellow-500")} />
                        {githubToken ? DICT.common.connectedGithub : DICT.common.notConfiguredToken}
                    </div>
                    <div>源：{repoSources.length + 1} 个 (1 本地 + {repoSources.length} 远程)</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedPaperId ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        {/* Placeholder for Paper Detail View */}
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">{DICT.manage.paperEditor}</h2>
                            <p>正在开发中... (Paper ID: {selectedPaperId})</p>
                            <p className="text-sm mt-4 max-w-md mx-auto">
                                下一步计划：在此处显示题目列表表格，支持批量编辑、拖拽排序和快速预览。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-8 overflow-auto">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">概览</h1>
                                <p className="text-muted-foreground">{DICT.manage.statsDesc}</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">总试卷数</CardTitle>
                                        <Book className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{papers?.length || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{DICT.manage.totalQuestions}</CardTitle>
                                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">--</div>
                                        <p className="text-xs text-muted-foreground">{DICT.manage.needLoadStats}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{DICT.manage.githubConnection}</CardTitle>
                                        <Github className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn("text-2xl font-bold", githubToken ? "text-green-600" : "text-yellow-600")}>
                                            {githubToken ? DICT.common.connected : DICT.common.notConnected}
                                        </div>
                                        {!githubToken && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                请在主页设置中配置 Token
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                <Card className="col-span-4">
                                    <CardHeader>
                                        <CardTitle>最近编辑</CardTitle>
                                        <CardDescription>
                                            本地缓存中的未同步修改。
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                            <span>{DICT.common.noSyncChanges}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
