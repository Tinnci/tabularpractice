import { Question, Paper } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Props {
    papers: Paper[];       // 当前选中的试卷组包含的所有年份试卷
    questions: Question[]; // 所有的题目数据
    onQuestionClick: (id: string) => void;
}

export function VerticalExamWall({ papers, questions, onQuestionClick }: Props) {
    // 1. 将题目绑定到对应的试卷(年份)上
    const questionsByPaperId = questions.reduce((acc, q) => {
        if (!acc[q.paperId]) acc[q.paperId] = [];
        acc[q.paperId].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    // 2. 对试卷按年份降序排序
    const sortedPapers = [...papers].sort((a, b) => b.year - a.year);

    return (
        <div className="w-full h-full border rounded-xl bg-muted/30">
            <ScrollArea className="w-full h-full whitespace-nowrap">
                <div className="flex p-4 space-x-4 w-max">

                    {sortedPapers.map((paper) => {
                        const paperQuestions = questionsByPaperId[paper.id] || [];
                        // 确保题目按题号排序
                        paperQuestions.sort((a, b) => a.number - b.number);

                        return (
                            <div key={paper.id} className="w-64 flex-shrink-0 flex flex-col gap-3">
                                {/* 年份表头 */}
                                <div className="sticky top-0 z-10 flex items-center justify-center py-3 mb-2 bg-muted/80 backdrop-blur-sm rounded-lg">
                                    <span className="text-2xl font-bold text-foreground font-mono select-none">
                                        {paper.year}
                                    </span>
                                </div>

                                {/* 题目列表 - 竖向排列 */}
                                <div className="flex flex-col gap-3 pb-10">
                                    {paperQuestions.map((q) => (
                                        <div key={q.id} className="relative group">
                                            {/* 题号标记 - 悬浮在卡片左上角 */}
                                            <div className="absolute -left-2 -top-2 z-20 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-background">
                                                {q.number}
                                            </div>

                                            {/* 题目卡片 */}
                                            <QuestionCard
                                                question={q}
                                                onClick={() => onQuestionClick(q.id)}
                                            />
                                        </div>
                                    ))}

                                    {paperQuestions.length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                            暂无录入
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
