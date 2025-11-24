import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status } from './types'

interface ProgressState {
    // 核心数据：记录题目ID对应的状态
    progress: Record<string, Status>;
    // 知识点筛选
    selectedTagId: string | null;
    // 新增：当前选中的试卷组ID
    currentGroupId: string;

    // 动作：更新状态
    updateStatus: (id: string, status: Status) => void;
    // 设置筛选标签
    setSelectedTagId: (id: string | null) => void;
    // 设置当前试卷组
    setCurrentGroupId: (id: string) => void;

    // 动作：获取统计数据
    getStats: () => { mastered: number; confused: number; failed: number; total: number };
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            selectedTagId: null,
            currentGroupId: 'math1', // 默认数学一

            updateStatus: (id, status) =>
                set((state) => ({
                    progress: { ...state.progress, [id]: status }
                })),

            setSelectedTagId: (id) => set({ selectedTagId: id }),

            setCurrentGroupId: (id) => set({ currentGroupId: id, selectedTagId: null }), // 切换试卷组时重置知识点筛选

            getStats: () => {
                const values = Object.values(get().progress);
                return {
                    mastered: values.filter(s => s === 'mastered').length,
                    confused: values.filter(s => s === 'confused').length,
                    failed: values.filter(s => s === 'failed').length,
                    total: values.length
                };
            }
        }),
        {
            name: 'tabular-progress-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
