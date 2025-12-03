import useSWR from 'swr';
import { useProgressStore } from '@/lib/store';
import { Paper } from '@/lib/types';

const multiSourcePapersFetcher = async (urls: string[]) => {
    const promises = urls.map(async (baseUrl) => {
        const target = baseUrl ? baseUrl : '/data';
        try {
            const res = await fetch(`${target}/papers.json`); // 拉取 papers.json
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) {
                return data.map((item: Paper) => ({ ...item, sourceUrl: baseUrl }));
            }
            return [];
        } catch { return []; }
    });

    const results = await Promise.all(promises);
    // 简单的合并去重逻辑
    const allPapers = results.flat() as Paper[];
    const uniquePapers = new Map<string, Paper>();
    allPapers.forEach(p => uniquePapers.set(p.id, p));
    return Array.from(uniquePapers.values());
};

export function usePapers() {
    const repoSources = useProgressStore(state => state.repoSources);
    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const { data, isLoading, mutate } = useSWR<Paper[]>(
        ['papers-list', ...enabledUrls],
        () => multiSourcePapersFetcher(enabledUrls),
        { revalidateOnFocus: false }
    );

    return { papers: data || [], isLoading, mutate };
}
