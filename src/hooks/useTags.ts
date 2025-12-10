import useSWR from 'swr';
import { TagNode } from '@/data/subject-tags';
import { useProgressStore } from '@/lib/store';
import { PINYIN_TO_ID_MAP } from '@/data/legacy-tags';

// Flat Tag Definition from JSON
export interface FlatTag {
    id: string;
    name: string;
    parentId: string | null;
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
 * Standardize Tag ID (Pinyin -> English)
 */
function normalizeId(id: string): string {
    return PINYIN_TO_ID_MAP[id] || id;
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

// Simple mapping of Subject -> Root Tag IDs (Normalized)
// This bridges the external data with the app's subject concept
const SUBJECT_ROOTS: Record<string, string[]> = {
    math: ['advanced-math', 'linear-algebra', 'probability-statistics'],
    english: ['vocabulary-grammar', 'reading-comprehension', 'cloze-test', 'writing'],
    politics: ['marxism', 'mao-theory', 'modern-history', 'morality-law', 'current-affairs']
};

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
    const getRootsForSubject = (subjectKey: string) => {
        if (!data) return [];
        const allowedRoots = SUBJECT_ROOTS[subjectKey] || null;

        // If config exists, filter by it
        if (allowedRoots) {
            return tagTree.filter(node => allowedRoots.includes(node.id));
        }

        // If no config (e.g. 'major'/other), return nothing or everything?
        // Maybe default to everything if small, or nothing.
        return [];
    };

    return {
        flatTags: data,
        tagTree, // All roots
        getRootsForSubject,
        isLoading,
        isError: error
    };
}
