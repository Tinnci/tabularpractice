import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status, NotesMap } from './types'

export interface RepoSource {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    isBuiltin?: boolean;
}

interface ProgressState {
    // 核心数据：记录题目ID对应的状态
    progress: Record<string, Status>;
    // 核心数据：记录题目ID对应的笔记 (Markdown)
    notes: NotesMap;
    // 核心数据：记录题目收藏状态
    stars: Record<string, boolean>;

    // 知识点筛选
    selectedTagId: string | null;
    // 当前选中的试卷组ID
    currentGroupId: string;
    // 派生属性：当前科目类型 (math/english/politics)
    filterSubject: 'math' | 'english' | 'politics';
    filterStatus: Status | 'all';
    filterType: 'all' | 'choice' | 'fill' | 'answer';
    filterYear: 'all' | string;
    filterStarred: boolean;

    updateStatus: (id: string, status: Status) => void;
    updateNote: (id: string, content: string) => void;
    toggleStar: (id: string) => void;
    setSelectedTagId: (id: string | null) => void;
    setCurrentGroupId: (id: string) => void;
    setFilterStatus: (status: Status | 'all') => void;
    setFilterType: (type: 'all' | 'choice' | 'fill' | 'answer') => void;
    setFilterYear: (year: 'all' | string) => void;
    setFilterStarred: (starred: boolean) => void;
    getStats: () => { mastered: number; confused: number; failed: number; total: number };
    importData: (data: { progress: Record<string, Status>; notes?: NotesMap; stars?: Record<string, boolean> } | Record<string, Status>) => void;
    importProgress: (newProgress: Record<string, Status>) => void;

    // 废弃：repoBaseUrl 不再作为单一数据源依据，保留仅为兼容
    repoBaseUrl: string;
    setRepoBaseUrl: (url: string) => void;

    // 多题库源管理
    repoSources: RepoSource[];
    addRepoSource: (name: string, url: string) => void;
    removeRepoSource: (id: string) => void;
    toggleRepoSource: (id: string, enabled: boolean) => void; // 新增

    lowDataMode: boolean;
    setLowDataMode: (enabled: boolean) => void;
    appearance: {
        cardWidth: number;
        cardHeight: number;
        columnSpacing: number;
        rowSpacing: number;
        heightMode: 'fixed' | 'auto';
        compactMode: boolean;
    };
    setAppearance: (settings: Partial<{
        cardWidth: number;
        cardHeight: number;
        columnSpacing: number;
        rowSpacing: number;
        heightMode: 'fixed' | 'auto';
        compactMode: boolean;
    }>) => void;

    // UI 状态
    mobileSidebarOpen: boolean;
    setMobileSidebarOpen: (open: boolean) => void;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            notes: {},
            stars: {},
            selectedTagId: null,
            currentGroupId: 'math1',
            filterSubject: 'math',
            filterStatus: 'all',
            filterType: 'all',
            filterYear: 'all',
            filterStarred: false,
            repoBaseUrl: '',

            // 初始化时确保包含内置源和默认远程源
            repoSources: [
                { id: 'local', name: '内置题库', url: '', enabled: true, isBuiltin: true },
                { id: 'default-remote', name: '题库1 (GitHub)', url: 'https://raw.githubusercontent.com/Tinnci/tabularpractice-data/main', enabled: true, isBuiltin: false }
            ],

            appearance: {
                cardWidth: 192,
                cardHeight: 64,
                columnSpacing: 0,
                rowSpacing: 0,
                heightMode: 'auto',
                compactMode: true,
            },

            setRepoBaseUrl: (url) => set({ repoBaseUrl: url }),
            setFilterType: (type) => set({ filterType: type }),
            setFilterYear: (year) => set({ filterYear: year }),
            setFilterStarred: (starred) => set({ filterStarred: starred }),

            addRepoSource: (name, url) => set((state) => ({
                repoSources: [
                    ...state.repoSources,
                    { id: crypto.randomUUID(), name, url, enabled: true } // 新添加的默认启用
                ]
            })),

            removeRepoSource: (id) => set((state) => ({
                repoSources: state.repoSources.filter(s => s.id !== id)
            })),

            toggleRepoSource: (id, enabled) => set((state) => ({
                repoSources: state.repoSources.map(s =>
                    s.id === id ? { ...s, enabled } : s
                )
            })),

            lowDataMode: false,
            setLowDataMode: (enabled) => set({ lowDataMode: enabled }),

            setAppearance: (settings) => set((state) => ({
                appearance: { ...state.appearance, ...settings }
            })),

            mobileSidebarOpen: false,
            setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

            // ... existing methods ...

            updateStatus: (id, status) =>
                set((state) => ({
                    progress: { ...state.progress, [id]: status }
                })),

            updateNote: (id, content) =>
                set((state) => ({
                    notes: { ...state.notes, [id]: content }
                })),

            toggleStar: (id) =>
                set((state) => {
                    const newStars = { ...state.stars };
                    if (newStars[id]) {
                        delete newStars[id];
                    } else {
                        newStars[id] = true;
                    }
                    return { stars: newStars };
                }),

            setSelectedTagId: (id) => set({ selectedTagId: id }),

            setCurrentGroupId: (id) => {
                let subject: 'math' | 'english' | 'politics' = 'math';
                if (id.startsWith('english')) subject = 'english';
                else if (id.startsWith('politics')) subject = 'politics';

                set({
                    currentGroupId: id,
                    selectedTagId: null,
                    filterSubject: subject
                });
            },

            setFilterStatus: (status) => set({ filterStatus: status }),

            getStats: () => {
                const values = Object.values(get().progress);
                return {
                    mastered: values.filter(s => s === 'mastered').length,
                    confused: values.filter(s => s === 'confused').length,
                    failed: values.filter(s => s === 'failed').length,
                    total: values.length
                };
            },

            importData: (data) => {
                // 检查是否是新版格式 (包含 progress 字段)
                // 使用类型断言来帮助 TypeScript 推断
                const isNewFormat = (d: unknown): d is { progress: Record<string, Status>; notes?: NotesMap; stars?: Record<string, boolean> } => {
                    return typeof d === 'object' && d !== null && 'progress' in d;
                };

                if (isNewFormat(data)) {
                    set({
                        progress: data.progress,
                        notes: data.notes || {},
                        stars: data.stars || {}
                    });
                } else {
                    // 旧版格式，直接是 progress 对象
                    set({ progress: data as Record<string, Status> });
                }
            },

            importProgress: (newProgress) => set({ progress: newProgress }),
        }),
        {
            name: 'tabular-progress-storage',
            storage: createJSONStorage(() => localStorage),
            version: 1, // 增加版本号
            migrate: (persistedState: unknown, version) => {
                if (version === 0) {
                    // 迁移逻辑：如果旧版本没有 repoSources 或者没有默认远程源，添加它
                    // 注意：这里 persistedState 是 unknown，需要小心处理
                    const state = persistedState as ProgressState;
                    const defaultRemote = { id: 'default-remote', name: '官方题库 (GitHub)', url: 'https://raw.githubusercontent.com/Tinnci/tabularpractice-data/main', enabled: true, isBuiltin: false };

                    let newRepoSources = state.repoSources || [{ id: 'local', name: '内置题库', url: '', enabled: true, isBuiltin: true }];

                    // 检查是否已存在（避免重复添加）
                    const hasDefaultRemote = newRepoSources.some(s => s.url === defaultRemote.url);
                    if (!hasDefaultRemote) {
                        newRepoSources = [...newRepoSources, defaultRemote];
                    }

                    return {
                        ...state,
                        repoSources: newRepoSources
                    };
                }
                return persistedState as ProgressState;
            },
        }
    )
)
