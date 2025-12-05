import { useState, useEffect, useMemo } from "react";
import { QuestionCard } from "./QuestionCard"
import { Question } from "@/lib/types"
import { VList } from "virtua";

interface Props {
    questions: Question[];
    onQuestionClick: (id: string) => void;
}

export function ExamWall({ questions, onQuestionClick }: Props) {
    const [columns, setColumns] = useState(2);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1280) setColumns(8);      // xl
            else if (width >= 1024) setColumns(6); // lg
            else if (width >= 768) setColumns(4);  // md
            else setColumns(2);                    // default
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const rows = useMemo(() => {
        const result = [];
        for (let i = 0; i < questions.length; i += columns) {
            result.push(questions.slice(i, i + columns));
        }
        return result;
    }, [questions, columns]);

    return (
        <div className="p-4">
            {/* VList automatically handles window scrolling if no specific height is set */}
            <VList>
                {rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4 mb-4"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {row.map(q => (
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
