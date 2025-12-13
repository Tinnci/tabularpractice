import useSWR from 'swr';
import { TagNode } from '@/data/subject-tags';
import { useProgressStore } from '@/lib/store';

// Flat Tag Definition from JSON
export interface FlatTag {
    id: string;
    name: string;
    parentId: string | null;
    subjectKey?: string;  // 科目标识，仅根节点有
    isRoot?: boolean;     // 是否为顶级分类
}

// Fetcher for tags.json
const tagsFetcher = async (urls: string[]) => {
    for (const baseUrl of urls) {
        const target = baseUrl ? baseUrl : '/data';
        try {
            const res = await fetch(`${target}/tags.json`);
            if (res.ok) {
                return await res.json() as FlatTag[];
            }
        } catch {
            console.warn(`Failed to fetch tags from ${target}`);
        }
    }
    return [];
};

/**
 * Standardize Tag ID
 * (Legacy pinyin support removed - all data sources now use English IDs)
 */
function normalizeId(id: string): string {
    return id;
}

/**
 * Convert flat tags list to tree structure, with Normalization
 */
export function buildTagTree(flatTags: FlatTag[]): TagNode[] {
    const nodeMap = new Map<string, TagNode>();
    const rootNodes: TagNode[] = [];

    // 1. Create nodes with Normalized IDs
    flatTags.forEach(tag => {
        const normalizedId = normalizeId(tag.id);
        nodeMap.set(normalizedId, {
            id: normalizedId,
            label: tag.name,
            children: []
        });
    });

    // 2. Build Hierarchy
    flatTags.forEach(tag => {
        const normalizedId = normalizeId(tag.id);
        const node = nodeMap.get(normalizedId)!;

        const parentId = tag.parentId ? normalizeId(tag.parentId) : null;

        if (parentId && nodeMap.get(parentId)) {
            const parent = nodeMap.get(parentId)!;
            parent.children!.push(node);
        } else {
            rootNodes.push(node);
        }
    });

    return rootNodes;
}

// 数据驱动：不再硬编码科目根节点映射
// 科目根节点现在由 tags.json 中的 subjectKey 和 isRoot 字段定义

export function useTags() {
    const repoSources = useProgressStore(state => state.repoSources);

    const enabledUrls = (repoSources && repoSources.length > 0)
        ? repoSources.filter(s => s.enabled).map(s => s.url)
        : [''];
    if (enabledUrls.length === 0) enabledUrls.push('');

    const { data, error, isLoading } = useSWR<FlatTag[]>(
        ['tags-json', ...enabledUrls],
        () => tagsFetcher(enabledUrls),
        {
            revalidateOnFocus: false,
        }
    );

    // Memoize this if perf issues arise
    const tagTree = data ? buildTagTree(data) : [];

    // Helper to get tags for a specific subject
    // 数据驱动：从 tags.json 的 subjectKey 和 isRoot 字段动态读取
    const getRootsForSubject = (subjectKey: string) => {
        if (!data) return [];

        // 从数据中找出属于该科目的根节点ID
        const rootIds = data
            .filter(tag => tag.subjectKey === subjectKey && tag.isRoot)
            .map(tag => normalizeId(tag.id));

        // 如果数据中没有定义，返回空数组
        if (rootIds.length === 0) {
            return [];
        }

        // 返回树形结构中对应的根节点
        return tagTree.filter(node => rootIds.includes(node.id));
    };

    return {
        flatTags: data,
        tagTree, // All roots
        getRootsForSubject,
        isLoading,
        isError: error
    };
}
