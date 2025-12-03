import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status, NotesMap, Question, Paper, PaperGroup, RepoSource } from './types'
import { syncService, SyncData } from '@/services/syncService'

interface ProgressState {
    // 核心数据：记录题目ID对应的状态
    progress: Record<string, Status>;
    progressLastModified: Record<string, number>; // Timestamp for sync conflict resolution

    // 核心数据：记录题目ID对应的笔记 (Markdown)
    notes: NotesMap;
    notesLastModified: Record<string, number>; // Timestamp for sync conflict resolution

    // 核心数据：记录题目收藏状态
    stars: Record<string, boolean>;
    // 核心数据：记录每日刷题活动
    history: Record<string, number>;

    // 知识点筛选
    selectedTagId: string | null;
    // 当前选中的试卷组ID
    currentGroupId: string;
    // 上次打开的题目ID (用于继续刷题)
    lastQuestionId: string | null;
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
    setLastQuestionId: (id: string | null) => void;
    setFilterStatus: (status: Status | 'all') => void;
    setFilterType: (type: 'all' | 'choice' | 'fill' | 'answer') => void;
    setFilterYear: (year: 'all' | string) => void;
    setFilterStarred: (starred: boolean) => void;
    getStats: () => { mastered: number; confused: number; failed: number; total: number };
    importData: (data: any) => void;
    importProgress: (newProgress: Record<string, Status>) => void;

    // 废弃：repoBaseUrl 不再作为单一数据源依据，保留仅为兼容
    repoBaseUrl: string;
    setRepoBaseUrl: (url: string) => void;

    // 多题库源管理
    repoSources: RepoSource[];
    addRepoSource: (name: string, url: string) => void;
    removeRepoSource: (id: string) => void;
    toggleRepoSource: (id: string, enabled: boolean) => void;

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

    // GitHub Sync
    githubToken: string | null;
    gistId: string | null;
    lastSyncedTime: string | null;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    setGithubToken: (token: string | null) => void;
    setGistId: (id: string | null) => void;
    setLastSyncedTime: (time: string | null) => void;
    setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;

    syncData: (isAutoSync?: boolean) => Promise<void>;
    triggerAutoSync: () => void;

    // Custom Data (AI Imported)
    customQuestions: Record<string, Question>;
    customPapers: Record<string, Paper>;
    customPaperGroups: Record<string, PaperGroup>;
    addCustomData: (data: { questions?: Question[], papers?: Paper[], groups?: PaperGroup[] }) => void;

    // AI Settings
    geminiApiKey: string | null;
    setGeminiApiKey: (key: string | null) => void;
}

let syncTimer: NodeJS.Timeout | null = null;

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            progressLastModified: {},
            history: {},
            notes: {},
            notesLastModified: {},
            stars: {},
            selectedTagId: null,
            currentGroupId: 'math1',
            lastQuestionId: null,
            filterSubject: 'math',
            filterStatus: 'all',
            filterType: 'all',
            filterYear: 'all',
            filterStarred: false,
            repoBaseUrl: '',

            // GitHub Sync
            githubToken: null,
            gistId: null,
            lastSyncedTime: null,
            syncStatus: 'idle',
            setGithubToken: (token) => set({ githubToken: token }),
            setGistId: (id) => set({ gistId: id }),
            setLastSyncedTime: (time) => set({ lastSyncedTime: time }),
            setSyncStatus: (status) => set({ syncStatus: status }),

            // Custom Data
            customQuestions: {},
            customPapers: {},
            customPaperGroups: {},
            geminiApiKey: null,

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),

            addCustomData: ({ questions = [], papers = [], groups = [] }) => set((state) => {
                const newQuestions = { ...state.customQuestions };
                questions.forEach(q => newQuestions[q.id] = q);

                const newPapers = { ...state.customPapers };
                papers.forEach(p => newPapers[p.id] = p);

                const newGroups = { ...state.customPaperGroups };
                groups.forEach(g => newGroups[g.id] = g);

                return {
                    customQuestions: newQuestions,
                    customPapers: newPapers,
                    customPaperGroups: newGroups
                };
            }),

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

            updateStatus: (id, status) => {
                set((state) => {
                    const today = new Date().toISOString().split('T')[0];
                    const currentCount = state.history[today] || 0;

                    const newHistory = { ...state.history };
                    if (status !== 'unanswered') {
                        newHistory[today] = currentCount + 1;
                    }

                    return {
                        progress: { ...state.progress, [id]: status },
                        progressLastModified: { ...state.progressLastModified, [id]: Date.now() },
                        history: newHistory
                    };
                });
                get().triggerAutoSync();
            },

            updateNote: (id, content) => {
                set((state) => ({
                    notes: { ...state.notes, [id]: content },
                    notesLastModified: { ...state.notesLastModified, [id]: Date.now() }
                }));
                get().triggerAutoSync();
            },

            toggleStar: (id) => {
                set((state) => {
                    const newStars = { ...state.stars };
                    if (newStars[id]) {
                        delete newStars[id];
                    } else {
                        newStars[id] = true;
                    }
                    return { stars: newStars };
                });
                get().triggerAutoSync();
            },

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

            setLastQuestionId: (id) => set({ lastQuestionId: id }),

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
                const isNewFormat = (d: any): d is SyncData => {
                    return typeof d === 'object' && d !== null && 'progress' in d;
                };

                if (isNewFormat(data)) {
                    set((state) => {
                        let newRepoSources = state.repoSources;
                        if (data.repoSources && Array.isArray(data.repoSources)) {
                            const existingUrls = new Set(state.repoSources.map(s => s.url));
                            const uniqueNewSources = data.repoSources.filter(s => !existingUrls.has(s.url));
                            newRepoSources = [...state.repoSources, ...uniqueNewSources];
                        }

                        return {
                            progress: data.progress,
                            progressLastModified: data.progressLastModified || {},
                            notes: data.notes || {},
                            notesLastModified: data.notesLastModified || {},
                            stars: data.stars || {},
                            repoSources: newRepoSources
                        };
                    });
                } else {
                    // 旧版格式，直接是 progress 对象
                    set({ progress: data as Record<string, Status> });
                }
            },

            importProgress: (newProgress) => set({ progress: newProgress }),

            // GitHub Sync Implementation
            syncData: async (isAutoSync = false) => {
                const { githubToken, gistId, progress, progressLastModified, notes, notesLastModified, stars, repoSources, importData } = get();

                if (!githubToken) return;

                set({ syncStatus: 'syncing' });

                try {
                    const currentData: SyncData = {
                        version: 3,
                        timestamp: new Date().toISOString(),
                        progress,
                        progressLastModified,
                        notes,
                        notesLastModified,
                        stars,
                        repoSources
                    };

                    let targetGistId = gistId;
                    let mergedData = currentData;

                    if (targetGistId) {
                        const remoteData = await syncService.fetchGist(githubToken, targetGistId);
                        if (remoteData) {
                            mergedData = syncService.mergeData(currentData, remoteData);
                        } else {
                            targetGistId = null; // Gist not found
                        }
                    }

                    const result = await syncService.uploadGist(githubToken, targetGistId, mergedData);

                    if (!targetGistId) {
                        set({ gistId: result.id });
                    }
                    set({ lastSyncedTime: new Date().toISOString(), syncStatus: 'success' });

                    if (!isAutoSync) {
                        importData(mergedData);
                    }

                    setTimeout(() => set({ syncStatus: 'idle' }), 3000);

                } catch (error) {
                    console.error(error);
                    set({ syncStatus: 'error' });
                }
            },

            triggerAutoSync: () => {
                const { githubToken } = get();
                if (!githubToken) return;

                if (syncTimer) clearTimeout(syncTimer);
                set({ syncStatus: 'syncing' });

                syncTimer = setTimeout(() => {
                    get().syncData(true); // 传入 true 标识为自动同步
                }, 5000); // 5秒防抖
            },
        }),
        {
            name: 'tabular-progress-storage',
            storage: createJSONStorage(() => localStorage),
            version: 2, // 增加版本号
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as ProgressState & { drafts?: Record<string, string> };

                // 迁移逻辑
                if (version < 2) {
                    // 如果有旧的 drafts，这里其实很难直接迁移到 IndexedDB 因为这里是同步的
                    // 我们只能丢弃或者暂时保留在内存中？
                    // 实际上，由于我们改变了 store 结构，旧的 drafts 会被丢弃。
                    // 如果用户非常在意草稿，这是一个 breaking change。
                    // 但考虑到这是一个重构任务，且我们没有简便的方法在 migrate 中做 async 操作。
                    // 我们可以在组件挂载时做一次性的迁移检查（如果 localStorage 还有旧数据）。
                    // 但这里我们只负责 store 的结构迁移。

                    return {
                        ...state,
                        progressLastModified: {},
                        notesLastModified: {},
                        // 确保移除 drafts
                        drafts: undefined
                    };
                }
                return state;
            },
        }
    )
)
