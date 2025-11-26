import { Question, Paper } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProgressStore } from "@/lib/store";

interface Props {
    papers: Paper[];       // 当前选中的试卷组包含的所有年份试卷
    questions: Question[]; // 所有的题目数据
    onQuestionClick: (id: string) => void;
    highlightTagId: string | null; // 高亮显示的 Tag ID
}

export function VerticalExamWall({ papers, questions, onQuestionClick, highlightTagId }: Props) {
    const { appearance } = useProgressStore();

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
                <div
                    className="flex p-4 w-max"
                    style={{ gap: `${appearance.columnSpacing}px` }}
                >

                    {sortedPapers.map((paper) => {
                        const paperQuestions = questionsByPaperId[paper.id] || [];
                        // 确保题目按题号排序
                        paperQuestions.sort((a, b) => a.number - b.number);

                        return (
                            <div
                                key={paper.id}
                                className="flex-shrink-0 flex flex-col bg-white/50 dark:bg-slate-900/50 rounded-lg p-2 shadow-sm border border-slate-200/50"
                                style={{ width: `${appearance.cardWidth}px` }}
                            >
                                {/* 年份表头：模仿粉笔字/手写体 */}
                                <div className="sticky top-0 z-10 py-2 text-center font-mono text-xl font-bold text-slate-700 dark:text-slate-300 drop-shadow-sm">
                                    {paper.year}
                                </div>

                                {/* 题目列表 - 竖向排列 */}
                                <div
                                    className="flex flex-col pb-2"
                                    style={{ gap: `${appearance.rowSpacing}px` }}
                                >
                                    {paperQuestions.map((q) => (
                                        <QuestionCard
                                            key={q.id}
                                            question={q}
                                            onClick={() => onQuestionClick(q.id)}
                                            isDimmed={!!highlightTagId && !q.tags.includes(highlightTagId)}
                                            height={appearance.cardHeight}
                                        />
                                    ))}

                                    {paperQuestions.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-xs">
                                            暂无
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
