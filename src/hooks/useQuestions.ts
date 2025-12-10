import useSWR from 'swr';
import { useProgressStore } from '@/lib/store';
import { Question, PaperDetail, PaperGroup } from '@/lib/types';



// 多源 fetcher
const multiSourceFetcher = async (urls: string[]) => {
    const promises = urls.map(async (baseUrl) => {
        // 空字符串代表本地源 /data
        const target = baseUrl ? baseUrl : '/data';
        try {
            const res = await fetch(`${target}/index.json`);
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) {
                return data.map((item: Question) => ({ ...item, sourceUrl: baseUrl }));
            }
            return [];
        } catch (e) {
            console.error(`Failed to fetch from ${target}`, e);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const allQuestions = results.flat();

    // 去重：基于 ID
    const uniqueQuestions = new Map<string, Question>();
    allQuestions.forEach(q => {
        if (!uniqueQuestions.has(q.id)) {
            uniqueQuestions.set(q.id, q);
        }
    });

    return Array.from(uniqueQuestions.values());
};

// 多源 PaperGroups fetcher
const multiSourcePaperGroupsFetcher = async (urls: string[]) => {
    const promises = urls.map(async (baseUrl) => {
        const target = baseUrl ? baseUrl : '/data';
        try {
            const res = await fetch(`${target}/paperGroups.json`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            // 某些源可能没有 paperGroups.json，这是允许的
            return [];
        }
    });

    const results = await Promise.all(promises);
    const allGroups = results.flat() as PaperGroup[];

    // 去重：如果多个源有相同的 ID，保留第一个
    const uniqueGroups = new Map<string, PaperGroup>();
    allGroups.forEach(group => {
        if (!uniqueGroups.has(group.id)) {
            uniqueGroups.set(group.id, group);
        }
    });

    return Array.from(uniqueGroups.values());
};

export function useQuestions() {
    const repoSources = useProgressStore(state => state.repoSources);

    // 获取所有启用的源 URL
    // 如果 repoSources 为空（旧数据），回退到 [''] (本地源)
    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];

    // 如果没有启用的源，默认启用本地源
    if (enabledUrls.length === 0) enabledUrls.push('');

    const customQuestions = useProgressStore(state => state.customQuestions);
    const hiddenPaperIds = useProgressStore(state => state.hiddenPaperIds);
    const hiddenGroupIds = useProgressStore(state => state.hiddenGroupIds);

    const { data, error, isLoading } = useSWR<Question[]>(
        ['questions-index', ...enabledUrls], // Key 包含所有 URL，变化时自动重刷
        () => multiSourceFetcher(enabledUrls),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    // Merge custom questions
    let questionsIndex = data ? [...data, ...Object.values(customQuestions)] : Object.values(customQuestions);

    // Filter hidden papers
    if (hiddenPaperIds && hiddenPaperIds.length > 0) {
        questionsIndex = questionsIndex.filter(q => !hiddenPaperIds.includes(q.paperId));
    }

    // Filter hidden groups (paperId format is usually "groupId-year", e.g., "zhangyu-4-set1-2026")
    if (hiddenGroupIds && hiddenGroupIds.length > 0) {
        questionsIndex = questionsIndex.filter(q => {
            // Check if any hidden group is a prefix of this question's paperId
            return !hiddenGroupIds.some(groupId => q.paperId.startsWith(groupId));
        });
    }

    return {
        questionsIndex,
        isLoading,
        isError: error
    };
}

export function usePaperDetail(paperId: string | null) {
    const repoSources = useProgressStore(state => state.repoSources);
    const customPapers = useProgressStore(state => state.customPapers);
    const customQuestions = useProgressStore(state => state.customQuestions);

    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const isCustom = paperId && customPapers[paperId];

    const fetchPaperDetail = async () => {
        if (!paperId) return null;

        const promises = enabledUrls.map(async (baseUrl) => {
            const target = baseUrl ? baseUrl : '/data';
            try {
                const res = await fetch(`${target}/papers/${paperId}/index.json`);
                if (!res.ok) throw new Error(`Failed to fetch from ${target}`);
                return await res.json();
            } catch (e) {
                throw e;
            }
        });

        try {
            return await Promise.any(promises);
        } catch {
            throw new Error("Paper not found in any active source");
        }
    };

    const { data, error, isLoading } = useSWR<PaperDetail>(
        (paperId && !isCustom) ? ['paper-detail', paperId, ...enabledUrls] : null,
        fetchPaperDetail,
        {
            revalidateOnFocus: false
        }
    );

    if (isCustom && paperId) {
        const paper = customPapers[paperId];
        const questions = Object.values(customQuestions).filter(q => q.paperId === paperId);
        const questionsMap: Record<string, Question> = {};
        questions.forEach(q => questionsMap[q.id] = q);

        return {
            paperDetail: {
                paperId: paper.id,
                year: paper.year,
                questions: questionsMap
            },
            isLoading: false,
            isError: null
        };
    }

    return {
        paperDetail: data,
        isLoading,
        isError: error
    };
}


export function usePaperGroups() {
    const repoSources = useProgressStore(state => state.repoSources);
    const customPaperGroups = useProgressStore(state => state.customPaperGroups);

    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const { data, error, isLoading } = useSWR<PaperGroup[]>(
        ['paper-groups', ...enabledUrls],
        () => multiSourcePaperGroupsFetcher(enabledUrls),
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false
        }
    );

    // Merge custom groups
    const paperGroups = data ? [...data, ...Object.values(customPaperGroups)] : Object.values(customPaperGroups);

    return {
        paperGroups,
        isLoading,
        isError: error
    };
}
