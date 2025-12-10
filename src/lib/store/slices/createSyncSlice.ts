import { StateCreator } from 'zustand';
import { syncService, SyncData } from '@/services/syncService';
import { StoreState } from '../types';
import { toast } from 'sonner';

export interface SyncSlice {
    githubToken: string | null;
    gistId: string | null;
    lastSyncedTime: string | null;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';

    pendingConflict: { local: SyncData, remote: SyncData, lastServerTime: string } | null;
    resolveConflict: (strategy: 'local' | 'remote' | 'merge') => Promise<void>;
    isDirty: boolean;

    setGithubToken: (token: string | null) => void;
    setGistId: (id: string | null) => void;
    setLastSyncedTime: (time: string | null) => void;
    setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;


    syncData: (isAutoSync?: boolean) => Promise<void>;
    triggerAutoSync: () => void;

    tokenScopes: string[];
    validateToken: (token: string) => Promise<void>;
}

let syncTimer: NodeJS.Timeout | null = null;

export const createSyncSlice: StateCreator<StoreState, [], [], SyncSlice> = (set, get) => ({
    githubToken: null,
    gistId: null,
    lastSyncedTime: null,
    syncStatus: 'idle',
    pendingConflict: null,
    isDirty: false,
    tokenScopes: [],

    setGithubToken: (token) => {
        set({ githubToken: token });
        if (token) {
            get().validateToken(token);
        } else {
            set({ tokenScopes: [] });
        }
    },
    setGistId: (id) => set({ gistId: id }),
    setLastSyncedTime: (time) => set({ lastSyncedTime: time }),
    setSyncStatus: (status) => set({ syncStatus: status }),

    validateToken: async (token: string) => {
        try {
            const res = await fetch('https://api.github.com/user', {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                }
            });

            if (res.ok) {
                const scopes = res.headers.get('x-oauth-scopes') || '';
                set({ tokenScopes: scopes.split(',').map(s => s.trim()) });
            } else {
                set({ tokenScopes: [] });
            }
        } catch (e) {
            console.error('Failed to validate token', e);
            set({ tokenScopes: [] });
        }
    },

    resolveConflict: async (strategy) => {
        const { pendingConflict, githubToken, gistId, importData, getSyncSnapshot } = get();
        if (!pendingConflict || !githubToken) return;

        let finalData: SyncData;

        if (strategy === 'remote') {
            finalData = pendingConflict.remote;
        } else if (strategy === 'local') {
            // [Optimization]: Always get the fresh local snapshot instead of using the stale one from pendingConflict
            const currentSnapshot = getSyncSnapshot();
            finalData = {
                ...pendingConflict.local, // Keep structure base
                ...currentSnapshot,       // Overwrite with fresh data
                timestamp: new Date().toISOString()
            } as SyncData;
        } else {
            // Merge strategy: also merge with fresh local data
            const currentSnapshot = getSyncSnapshot();
            const currentLocalData = { ...pendingConflict.local, ...currentSnapshot } as SyncData;
            finalData = syncService.mergeData(currentLocalData, pendingConflict.remote);
        }

        // Apply to local
        importData(finalData);

        // Upload to remote
        try {
            set({ syncStatus: 'syncing', pendingConflict: null });
            const targetId = gistId; // Capture current gistId

            const result = await syncService.uploadGist(githubToken, targetId, finalData);

            if (!targetId) {
                set({ gistId: result.id });
            }

            set({ lastSyncedTime: result.updated_at, syncStatus: 'success' });
            toast.success('冲突已解决', { description: '数据已同步' });
            setTimeout(() => set({ syncStatus: 'idle' }), 3000);
        } catch (error) {
            console.error(error);
            set({ syncStatus: 'error' });
            toast.error('同步失败', { description: '上传数据时出错' });
        }
    },

    syncData: async (isAutoSync = false) => {
        const {
            githubToken, gistId,
            getSyncSnapshot,
            importData,
            lastSyncedTime
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
                    const localSyncedTimeMs = lastSyncedTime ? new Date(lastSyncedTime).getTime() : 0;
                    // Use server updated_at for reliable time comparison
                    const remoteTimeMs = remoteData.updated_at ? new Date(remoteData.updated_at).getTime() : new Date(remoteData.timestamp).getTime();

                    // Conflict Detection: Remote is newer than our last sync time
                    // Using tolerance of 1s to avoid floating point/precision issues
                    if (remoteTimeMs > localSyncedTimeMs + 1000) {
                        set({
                            pendingConflict: {
                                local: currentData,
                                remote: remoteData,
                                lastServerTime: remoteData.updated_at || new Date().toISOString()
                            },
                            syncStatus: 'idle'
                        });
                        // Ask user to resolve conflict
                        return;
                    }

                    mergedData = syncService.mergeData(currentData, remoteData);
                } else {
                    targetGistId = null; // Gist not found
                }
            }

            const result = await syncService.uploadGist(githubToken, targetGistId, mergedData);

            if (!targetGistId) {
                set({ gistId: result.id });
            }
            // Use server timestamp as the new baseline
            set({ lastSyncedTime: result.updated_at, syncStatus: 'success', isDirty: false });

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
        set({ isDirty: true });

        syncTimer = setTimeout(() => {
            get().syncData(true);
        }, 5000); // 5s debounce
    },
});
