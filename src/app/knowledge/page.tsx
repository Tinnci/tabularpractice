"use client";

import { useState } from 'react';
import { KnowledgeGraph } from '@/components/business/KnowledgeGraph';
import { useQuestions } from '@/hooks/useQuestions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Network, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DICT } from '@/lib/i18n';
import { toast } from 'sonner';

export default function KnowledgePage() {
    const [subjectKey, setSubjectKey] = useState('math');
    const { questionsIndex: questions, isLoading } = useQuestions();
    const [selectedTag, setSelectedTag] = useState<{ id: string; label: string } | null>(null);

    const handleNodeClick = (tagId: string, tagLabel: string) => {
        setSelectedTag({ id: tagId, label: tagLabel });
        toast.info(`点击了知识点: ${tagLabel}`);
    };

    const handleStartPractice = () => {
        if (selectedTag) {
            // TODO: 跳转到练习页面，并自动过滤该 Tag
            window.location.href = `/practice?tag=${selectedTag.id}`;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Network className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">知识图谱</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={subjectKey} onValueChange={setSubjectKey}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="选择学科" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="math">高等数学</SelectItem>
                            <SelectItem value="linear-algebra">线性代数</SelectItem>
                            <SelectItem value="probability">概率统计</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Graph Area */}
                <div className="flex-1 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <KnowledgeGraph
                            questions={questions}
                            subjectKey={subjectKey}
                            onNodeClick={handleNodeClick}
                            className="w-full h-full"
                        />
                    )}
                </div>

                {/* Sidebar (Selected Node Info) */}
                {selectedTag && (
                    <Card className="w-80 m-4 p-4 shrink-0 space-y-4 animate-in slide-in-from-right">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold">{selectedTag.label}</h2>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            点击"开始练习"进入该知识点的专项练习。
                        </p>

                        <div className="flex flex-col gap-2">
                            <Button onClick={handleStartPractice} className="w-full">
                                开始练习
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedTag(null)} className="w-full">
                                取消选择
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Legend */}
            <footer className="px-6 py-3 border-t bg-card flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                <span className="font-medium">图例:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-200 border border-green-300"></span>
                    <span>掌握良好</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300"></span>
                    <span>需要复习</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-200 border border-red-300"></span>
                    <span>薄弱环节</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></span>
                    <span>未开始</span>
                </div>
            </footer>
        </div>
    );
}
