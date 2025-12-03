import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../storageAdapter';

import { createDataSlice } from './slices/createDataSlice';
import { createSettingsSlice } from './slices/createSettingsSlice';
import { createUISlice } from './slices/createUISlice';
import { createSyncSlice } from './slices/createSyncSlice';

import { StoreState } from './types';

export type { StoreState } from './types';

export const useProgressStore = create<StoreState>()(
    persist(
        (...a) => ({
            ...createDataSlice(...a),
            ...createSettingsSlice(...a),
            ...createUISlice(...a),
            ...createSyncSlice(...a),
        }),
        {
            name: 'tabular-progress-storage',
            storage: createJSONStorage(() => idbStorage),
            version: 2,
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
                return state;
            },
        }
    )
);
