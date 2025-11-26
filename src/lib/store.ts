import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status, NotesMap } from './types'

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
    // 新增：状态筛选 ('all' 表示不筛选)
    filterStatus: Status | 'all';
    // 新增：题型筛选
    filterType: 'all' | 'choice' | 'fill' | 'answer';
    // 新增：年份筛选
    filterYear: 'all' | string;
    // 新增：收藏筛选
    filterStarred: boolean;

    // 动作：更新状态
    updateStatus: (id: string, status: Status) => void;
    // 动作：更新笔记
    updateNote: (id: string, content: string) => void;
    // 动作：切换收藏
    toggleStar: (id: string) => void;

    // 设置筛选标签
    setSelectedTagId: (id: string | null) => void;
    // 设置当前试卷组
    setCurrentGroupId: (id: string) => void;
    // 设置状态筛选
    setFilterStatus: (status: Status | 'all') => void;
    // 设置题型筛选
    setFilterType: (type: 'all' | 'choice' | 'fill' | 'answer') => void;
    // 设置年份筛选
    setFilterYear: (year: 'all' | string) => void;
    // 设置收藏筛选
    setFilterStarred: (starred: boolean) => void;

    // 动作：获取统计数据
    getStats: () => { mastered: number; confused: number; failed: number; total: number };

    // 动作：导入数据 (支持旧版纯进度和新版进度+笔记)
    importData: (data: { progress: Record<string, Status>; notes?: NotesMap; stars?: Record<string, boolean> } | Record<string, Status>) => void;

    // 废弃：保留向后兼容，实际上调用 importData
    importProgress: (newProgress: Record<string, Status>) => void;

    // 自定义题库源 URL
    repoBaseUrl: string;
    setRepoBaseUrl: (url: string) => void;

    // 省流量模式
    lowDataMode: boolean;
    setLowDataMode: (enabled: boolean) => void;
    // 外观设置
    appearance: {
        cardWidth: number;
        cardHeight: number;
        columnSpacing: number;
        rowSpacing: number;
    };
    setAppearance: (settings: Partial<{
        cardWidth: number;
        cardHeight: number;
        columnSpacing: number;
        rowSpacing: number;
    }>) => void;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            notes: {},
            stars: {},
            selectedTagId: null,
            currentGroupId: 'math1', // 默认数学一
            filterSubject: 'math',
            filterStatus: 'all', // 默认显示全部
            filterType: 'all',
            filterYear: 'all',
            filterStarred: false,
            repoBaseUrl: '', // 默认为空，使用本地数据

            // 默认外观设置
            appearance: {
                cardWidth: 192, // w-48 = 12rem = 192px
                cardHeight: 64, // h-16 = 4rem = 64px (内容区域) -> 实际卡片高度会更高
                columnSpacing: 16, // space-x-4 = 1rem = 16px
                rowSpacing: 6, // space-y-1.5 = 0.375rem = 6px
            },

            setRepoBaseUrl: (url) => set({ repoBaseUrl: url }),
            setFilterType: (type) => set({ filterType: type }),
            setFilterYear: (year) => set({ filterYear: year }),
            setFilterStarred: (starred) => set({ filterStarred: starred }),

            // 省流量模式
            lowDataMode: false,
            setLowDataMode: (enabled) => set({ lowDataMode: enabled }),

            setAppearance: (settings) => set((state) => ({
                appearance: { ...state.appearance, ...settings }
            })),

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
        }
    )
)
