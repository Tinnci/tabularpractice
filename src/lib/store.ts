import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status, NotesMap } from './types'

interface ProgressState {
    // 核心数据：记录题目ID对应的状态
    progress: Record<string, Status>;
    // 核心数据：记录题目ID对应的笔记 (Markdown)
    notes: NotesMap;

    // 知识点筛选
    selectedTagId: string | null;
    // 当前选中的试卷组ID
    currentGroupId: string;
    // 新增：状态筛选 ('all' 表示不筛选)
    filterStatus: Status | 'all';

    // 动作：更新状态
    updateStatus: (id: string, status: Status) => void;
    // 动作：更新笔记
    updateNote: (id: string, content: string) => void;

    // 设置筛选标签
    setSelectedTagId: (id: string | null) => void;
    // 设置当前试卷组
    setCurrentGroupId: (id: string) => void;
    // 设置状态筛选
    setFilterStatus: (status: Status | 'all') => void;

    // 动作：获取统计数据
    getStats: () => { mastered: number; confused: number; failed: number; total: number };

    // 动作：导入数据 (支持旧版纯进度和新版进度+笔记)
    importData: (data: { progress: Record<string, Status>; notes?: NotesMap } | Record<string, Status>) => void;

    // 废弃：保留向后兼容，实际上调用 importData
    importProgress: (newProgress: Record<string, Status>) => void;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            notes: {},
            selectedTagId: null,
            currentGroupId: 'math1', // 默认数学一
            filterStatus: 'all', // 默认显示全部

            updateStatus: (id, status) =>
                set((state) => ({
                    progress: { ...state.progress, [id]: status }
                })),

            updateNote: (id, content) =>
                set((state) => ({
                    notes: { ...state.notes, [id]: content }
                })),

            setSelectedTagId: (id) => set({ selectedTagId: id }),

            setCurrentGroupId: (id) => set({ currentGroupId: id, selectedTagId: null }), // 切换试卷组时重置知识点筛选

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
                const isNewFormat = (d: any): d is { progress: Record<string, Status>; notes?: NotesMap } => {
                    return 'progress' in d && typeof d.progress === 'object';
                };

                if (isNewFormat(data)) {
                    set({
                        progress: data.progress,
                        notes: data.notes || {}
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
