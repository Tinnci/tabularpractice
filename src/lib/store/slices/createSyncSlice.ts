import { StateCreator } from 'zustand';
import { syncService, SyncData } from '@/services/syncService';
import { StoreState } from '../types';
import { toast } from 'sonner';

export interface SyncSlice {
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
}

let syncTimer: NodeJS.Timeout | null = null;

export const createSyncSlice: StateCreator<StoreState, [], [], SyncSlice> = (set, get) => ({
    githubToken: null,
    gistId: null,
    lastSyncedTime: null,
    syncStatus: 'idle',

    setGithubToken: (token) => set({ githubToken: token }),
    setGistId: (id) => set({ gistId: id }),
    setLastSyncedTime: (time) => set({ lastSyncedTime: time }),
    setSyncStatus: (status) => set({ syncStatus: status }),

    syncData: async (isAutoSync = false) => {
        const {
            githubToken, gistId,
            getSyncSnapshot,
            importData
        } = get();

        if (!githubToken) return;

        set({ syncStatus: 'syncing' });

        try {
            const dataSnapshot = getSyncSnapshot();

            const currentData: SyncData = {
                version: 3,
                timestamp: new Date().toISOString(),
                // Default values if snapshot is partial, though getSyncSnapshot should provide them
                progress: {},
                progressLastModified: {},
                notes: {},
                notesLastModified: {},
                times: {},
                timesLastModified: {},
                stars: {},
                repoSources: [],
                ...dataSnapshot
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
                toast.success('同步成功', { description: '数据已安全同步到 Gist' });
            }

            setTimeout(() => set({ syncStatus: 'idle' }), 3000);

        } catch (error) {
            console.error(error);
            set({ syncStatus: 'error' });
            toast.error('同步失败', { description: '请检查网络或 Token 设置' });
        }
    },

    triggerAutoSync: () => {
        const { githubToken } = get();
        if (!githubToken) return;

        if (syncTimer) clearTimeout(syncTimer);
        // Do not set 'syncing' status immediately to avoid UI flicker/frequent re-renders
        // set({ syncStatus: 'syncing' }); 

        syncTimer = setTimeout(() => {
            get().syncData(true);
        }, 5000); // 5s debounce
    },
});
