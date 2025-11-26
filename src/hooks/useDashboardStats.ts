import { useProgressStore } from "@/lib/store";
import { useMemo } from "react";

export function useDashboardStats() {
    const progress = useProgressStore(state => state.progress);

    return useMemo(() => {
        const stats = {
            total: { mastered: 0, confused: 0, failed: 0, unanswered: 0 },
            math: { total: 0, mastered: 0, confused: 0, failed: 0 },
            english: { total: 0, mastered: 0, confused: 0, failed: 0 },
            politics: { total: 0, mastered: 0, confused: 0, failed: 0 },
        };

        Object.entries(progress).forEach(([id, status]) => {
            // Global stats
            if (status === 'mastered') stats.total.mastered++;
            else if (status === 'confused') stats.total.confused++;
            else if (status === 'failed') stats.total.failed++;

            // Subject stats
            if (id.startsWith('math')) {
                stats.math.total++;
                if (status === 'mastered') stats.math.mastered++;
                else if (status === 'confused') stats.math.confused++;
                else if (status === 'failed') stats.math.failed++;
            } else if (id.startsWith('english')) {
                stats.english.total++;
                if (status === 'mastered') stats.english.mastered++;
                else if (status === 'confused') stats.english.confused++;
                else if (status === 'failed') stats.english.failed++;
            } else if (id.startsWith('politics')) {
                stats.politics.total++;
                if (status === 'mastered') stats.politics.mastered++;
                else if (status === 'confused') stats.politics.confused++;
                else if (status === 'failed') stats.politics.failed++;
            }
        });

        return stats;
    }, [progress]);
}
