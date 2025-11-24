import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Status } from './types'

interface ProgressState {
    // 核心数据：记录题目ID对应的状态
    progress: Record<string, Status>;
    // 新增：当前选中的知识点ID (null 代表显示全部)
    selectedTagId: string | null;

    // 动作：更新状态
    updateStatus: (id: string, status: Status) => void;
    // 新增：设置筛选标签
    setSelectedTagId: (id: string | null) => void;

    // 动作：获取统计数据
    getStats: () => { mastered: number; confused: number; failed: number; total: number };
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            selectedTagId: null, // 默认显示全部

            updateStatus: (id, status) =>
                set((state) => ({
                    progress: { ...state.progress, [id]: status }
                })),

            // 新增 action
            setSelectedTagId: (id) => set({ selectedTagId: id }),

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
            name: 'tabular-progress-storage', // LocalStorage 中的 key 名称
            storage: createJSONStorage(() => localStorage),
        }
    )
)
