import { useProgressStore } from '@/lib/store';
import { useQuestions } from '@/hooks/useQuestions';
import { useMemo } from 'react';

export function useMistakes() {
    const progress = useProgressStore(state => state.progress);
    const { questionsIndex, isLoading } = useQuestions();

    const mistakes = useMemo(() => {
        if (!questionsIndex) return [];
        return questionsIndex.filter(q => {
            const status = progress[q.id];
            // Filter for Failed or Confused questions
            return status === 'failed' || status === 'confused';
        }).sort((a, b) => {
            // Sort by ID for now, can be improved to sort by last modified time if available
            return a.id.localeCompare(b.id);
        });
    }, [questionsIndex, progress]);

    const stats = useMemo(() => {
        const failed = mistakes.filter(q => progress[q.id] === 'failed').length;
        const confused = mistakes.filter(q => progress[q.id] === 'confused').length;
        return { failed, confused, total: mistakes.length };
    }, [mistakes, progress]);

    return {
        mistakes,
        stats,
        isLoading
    };
}
