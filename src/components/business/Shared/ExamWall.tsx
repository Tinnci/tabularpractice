import { useState, useEffect, useMemo, useRef } from "react";
import { QuestionCard } from "./QuestionCard"
import { Question } from "@/lib/types"
import { VList, VListHandle } from "virtua";

interface Props {
    questions: Question[];
    onQuestionClick: (id: string) => void;
}

export function ExamWall({ questions, onQuestionClick }: Props) {
    const [columns, setColumns] = useState(4);
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
        updateColumns(containerRef.current.offsetWidth); // Initial update
        return () => observer.disconnect();
    }, []);

    // Chunk questions into rows of `columns` size
    const rows = useMemo(() => {
        const result: Question[][] = [];
        for (let i = 0; i < questions.length; i += columns) {
            result.push(questions.slice(i, i + columns));
        }
        return result;
    }, [questions, columns]);

    return (
        <div className="h-full w-full" ref={containerRef}>
            <VList ref={listRef} className="h-full">
                {rows.map((row, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="grid gap-3 p-2"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {row.map((q) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                onClick={() => onQuestionClick(q.id)}
                            />
                        ))}
                    </div>
                ))}
            </VList>
        </div>
    )
}

