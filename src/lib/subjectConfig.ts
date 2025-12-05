interface SubjectConfigItem {
    id: string;
    label: string;
    color: string;
    aliases: string[];
}

export const SUBJECT_CONFIG: Record<string, SubjectConfigItem> = {
    math: { id: 'math', label: "数学", color: "blue", aliases: ["math1", "math2", "math3"] },
    english: { id: 'english', label: "英语", color: "green", aliases: ["english1", "english2"] },
    politics: { id: 'politics', label: "政治", color: "red", aliases: [] },
    cs: { id: 'cs', label: "计算机统考", color: "purple", aliases: ["408"] },
    art: { id: 'art', label: "艺术概论", color: "orange", aliases: [] },
    other: { id: 'other', label: "其他", color: "gray", aliases: [] }
};

export function getSubjectKey(id: string): string {
    // 1. Check exact match or alias match
    for (const key in SUBJECT_CONFIG) {
        if (key === id || SUBJECT_CONFIG[key].aliases.includes(id)) {
            return key;
        }
    }

    // 2. Check prefix match
    for (const key in SUBJECT_CONFIG) {
        if (id.startsWith(key)) {
            return key;
        }
    }

    // 3. Regex fallback for complex IDs (e.g. shu-812 -> shu -> maybe mapped?)
    // For now, simple prefix matching covers most cases like 'math1', 'english2'

    return 'other';
}
