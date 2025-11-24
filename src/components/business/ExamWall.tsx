import { QuestionCard } from "./QuestionCard"
import { Question } from "@/lib/types"

interface Props {
    questions: Question[];
    onQuestionClick: (id: string) => void;
}

export function ExamWall({ questions, onQuestionClick }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
            {questions.map(q => (
                <QuestionCard
                    key={q.id}
                    question={q}
                    onClick={() => onQuestionClick(q.id)}
                />
            ))}
        </div>
    )
}
