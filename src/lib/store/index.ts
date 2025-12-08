import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../storageAdapter';

import { createDataSlice } from './slices/createDataSlice';
import { createSettingsSlice } from './slices/createSettingsSlice';
import { createUISlice } from './slices/createUISlice';
import { createSyncSlice } from './slices/createSyncSlice';
import { createAnalyticsSlice } from './slices/createAnalyticsSlice';

import { StoreState } from './types';



export const useProgressStore = create<StoreState>()(
    persist(
        (...a) => ({
            ...createDataSlice(...a),
            ...createSettingsSlice(...a),
            ...createUISlice(...a),
            ...createSyncSlice(...a),
            ...createAnalyticsSlice(...a),
        }),
        {
            name: 'tabular-progress-storage',
            storage: createJSONStorage(() => idbStorage),
            version: 3,  // 升级版本号
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as StoreState & { drafts?: Record<string, string> };

                if (version < 2) {
                    return {
                        ...state,
                        progressLastModified: {},
                        notesLastModified: {},
                        drafts: undefined
                    };
                }
                if (version < 3) {
                    // v3: 新增 Analytics
                    return {
                        ...state,
                        studyRecords: [],
                        dailyStatsCache: {},
                        analyticsMetadata: {
                            lastCleanup: 0,
                            recordsVersion: 1,
                        },
                    };
                }
                return state;
            },
            partialize: (state) => {
                // Filter out ephemeral UI state, computed/sync status, and caches
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { mobileSidebarOpen, syncStatus, dailyStatsCache, ...persistedState } = state;
                return persistedState;
            },
        }
    )
);
