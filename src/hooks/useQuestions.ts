import useSWR from 'swr';
import { useProgressStore } from '@/lib/store';
import { Question, Tag, PaperDetail, PaperGroup } from '@/lib/types';



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

    const { data, error, isLoading } = useSWR<Question[]>(
        ['questions-index', ...enabledUrls], // Key 包含所有 URL，变化时自动重刷
        () => multiSourceFetcher(enabledUrls),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    return {
        questionsIndex: data || [],
        isLoading,
        isError: error
    };
}

export function usePaperDetail(paperId: string | null) {
    // 试卷详情目前比较复杂，因为不知道这个 paperId 属于哪个源
    // 简单的做法是：尝试从所有启用的源 fetch，直到成功
    // 或者，我们在 questionsIndex 里应该包含 sourceUrl 信息？
    // 暂时简化：遍历所有源尝试 fetch

    const repoSources = useProgressStore(state => state.repoSources);
    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const fetchPaperDetail = async () => {
        if (!paperId) return null;

        for (const baseUrl of enabledUrls) {
            const target = baseUrl ? baseUrl : '/data';
            try {
                const res = await fetch(`${target}/papers/${paperId}/index.json`);
                if (res.ok) return await res.json();
            } catch {
                continue;
            }
        }
        throw new Error("Paper not found in any active source");
    };

    const { data, error, isLoading } = useSWR<PaperDetail>(
        paperId ? ['paper-detail', paperId, ...enabledUrls] : null,
        fetchPaperDetail,
        {
            revalidateOnFocus: false
        }
    );

    return {
        paperDetail: data,
        isLoading,
        isError: error
    };
}

export function useTags() {
    // Tags 目前通常是通用的，或者每个源都有自己的 tags.json
    // 简单起见，我们合并所有源的 tags
    const repoSources = useProgressStore(state => state.repoSources);
    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const fetchTags = async () => {
        const promises = enabledUrls.map(async (baseUrl) => {
            const target = baseUrl ? baseUrl : '/data';
            try {
                const res = await fetch(`${target}/tags.json`);
                if (!res.ok) return [];
                return await res.json();
            } catch { return []; }
        });
        const results = await Promise.all(promises);
        // 去重合并
        const allTags = results.flat() as Tag[];
        const uniqueTags = new Map<string, Tag>();
        allTags.forEach(tag => {
            if (!uniqueTags.has(tag.id)) uniqueTags.set(tag.id, tag);
        });
        return Array.from(uniqueTags.values());
    };

    const { data, error, isLoading } = useSWR<Tag[]>(
        ['tags', ...enabledUrls],
        fetchTags,
        {
            revalidateOnFocus: false,
            dedupingInterval: 600000,
        }
    );

    return {
        tags: data || [],
        isLoading,
        isError: error
    };
}

export function usePaperGroups() {
    const repoSources = useProgressStore(state => state.repoSources);
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

    return {
        paperGroups: data,
        isLoading,
        isError: error
    };
}
