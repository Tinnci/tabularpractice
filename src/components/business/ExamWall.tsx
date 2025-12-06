import { useState, useEffect, useMemo, useRef } from "react";
import { QuestionCard } from "./QuestionCard"
import { Question } from "@/lib/types"
import { VList, VListHandle } from "virtua";

interface Props {
    questions: Question[];
    onQuestionClick: (id: string) => void;
}

export function ExamWall({ questions, onQuestionClick }: Props) {
    const [columns, setColumns] = useState(2);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<VListHandle>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateColumns = (width: number) => {
            if (width >= 1280) setColumns(8);      // xl
            else if (width >= 1024) setColumns(6); // lg
            else if (width >= 768) setColumns(4);  // md
            else setColumns(2);                    // default
        };

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                updateColumns(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Group questions by year for visual separation
    const rows = useMemo(() => {
        const groups: Record<string, Question[]> = {};
        questions.forEach(q => {
            // Ensure we have a year or paper identifier. For now, assume grouped by paper/year implies implicit grouping.
            // Actually Questions usually have `paperId` or we can find `year` from paper map.
            // But `Question` type might not strictly have `year` directly on it unless we enriched it.
            // Let's check typical usage. VerticalExamWall uses 'papers' prop. ExamWall just 'questions'.
            // We can use a property like `paperId` as grouping key.
            const key = q.paperId || 'unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(q);
        });

        // We want to render them in order of appearance in the original `questions` list (which implies sorted)
        // So we iterate `questions`, detect change of `paperId`.
        const result: Array<{ type: 'header', id: string } | { type: 'grid', items: Question[] }> = [];

        let currentPaperId = '';
        let currentBuffer: Question[] = [];

        // Helper to flush buffer
        const flush = () => {
            if (currentBuffer.length > 0) {
                for (let i = 0; i < currentBuffer.length; i += columns) {
                    result.push({ type: 'grid', items: currentBuffer.slice(i, i + columns) });
                }
                currentBuffer = [];
            }
        };

        questions.forEach(q => {
            if (q.paperId !== currentPaperId) {
                flush();
                currentPaperId = q.paperId;
                // Add header row
                result.push({ type: 'header', id: currentPaperId });
            }
            currentBuffer.push(q);
        });
        flush();

        return result;
    }, [questions, columns]);

    return (
        <div className="p-4" ref={containerRef}>
            {/* VList automatically handles window scrolling if no specific height is set */}
            <VList ref={listRef}>
                {rows.map((row, rowIndex) => {
                    if (row.type === 'header') {
                        // Simple header
                        // Ideally we'd map ID to Name/Year, but we don't have papers map here yet.
                        // We can just render a divider for separation.
                        // Or if Question has `paperName` property (it seems strict typings don't include it in Base Question, but maybe we can extend).
                        // Let's just render a visual separator with ID for now.
                        return (
                            <div key={`header-${rowIndex}`} className="col-span-full pt-6 pb-2 px-2">
                                <div className="text-sm font-semibold text-muted-foreground border-b pb-1">
                                    {/* Use a cleaner look, maybe just the ID or Year if extractable */}
                                    {row.id.replace(/-/g, ' ').toUpperCase()}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={`row-${rowIndex}`}
                            className="grid gap-4 mb-4"
                            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                        >
                            {row.items.map((q) => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    onClick={() => onQuestionClick(q.id)}
                                />
                            ))}
                        </div>
                    );
                })}
            </VList>
        </div>
    )
}
