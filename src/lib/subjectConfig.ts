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
    major: { id: 'major', label: "专业课", color: "orange", aliases: [] },  // 新增：专业课（自命题）
    art: { id: 'art', label: "艺术概论", color: "pink", aliases: [] },
    other: { id: 'other', label: "其他", color: "gray", aliases: [] }
};

/**
 * 获取科目 Key
 * 
 * @param idOrSubjectKey - 可以是 PaperGroup.id, Paper.id, 或直接是 PaperGroup.subjectKey
 * @param directSubjectKey - 如果已知 subjectKey，直接传入可跳过推断（优先使用）
 * @returns 标准化的科目 key
 */
export function getSubjectKey(idOrSubjectKey: string, directSubjectKey?: string): string {
    // 1. 如果直接传入了 subjectKey 且有效，直接使用
    if (directSubjectKey && SUBJECT_CONFIG[directSubjectKey]) {
        return directSubjectKey;
    }

    // 2. 检查是否本身就是一个有效的 subjectKey
    if (SUBJECT_CONFIG[idOrSubjectKey]) {
        return idOrSubjectKey;
    }

    // 3. Check exact match or alias match
    for (const key in SUBJECT_CONFIG) {
        if (key === idOrSubjectKey || SUBJECT_CONFIG[key].aliases.includes(idOrSubjectKey)) {
            return key;
        }
    }

    // 4. Check prefix match (e.g., "math1-2023" → "math")
    for (const key in SUBJECT_CONFIG) {
        if (idOrSubjectKey.startsWith(key)) {
            return key;
        }
    }

    // 5. 自命题检测：如果包含 "-" 且有院校前缀，归类为专业课
    if (idOrSubjectKey.includes('-')) {
        const prefix = idOrSubjectKey.split('-')[0];
        // 常见院校缩写检测（可扩展）
        const universityPrefixes = ['shu', 'pku', 'thu', 'fdu', 'sjtu', 'zju', 'nju', 'hust', 'whu'];
        if (universityPrefixes.includes(prefix.toLowerCase())) {
            return 'major';
        }
    }

    return 'other';
}

/**
 * 获取科目配置
 */
export function getSubjectConfig(subjectKey: string): SubjectConfigItem {
    return SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG['other'];
}
