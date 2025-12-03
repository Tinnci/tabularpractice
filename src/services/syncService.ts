import { Status, NotesMap, RepoSource } from '@/lib/types';

export interface SyncData {
    version: number;
    timestamp: string;
    progress: Record<string, Status>;
    progressLastModified?: Record<string, number>; // New: Timestamp for each progress item
    notes: NotesMap;
    notesLastModified?: Record<string, number>; // New: Timestamp for each note
    stars: Record<string, boolean>;
    repoSources: RepoSource[];
    times?: Record<string, number>;
    timesLastModified?: Record<string, number>;
}

export const syncService = {
    async fetchGist(token: string, gistId: string): Promise<SyncData | null> {
        const headers = {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        };

        try {
            const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
            if (res.ok) {
                const gist = await res.json();
                const file = gist.files["tabular-practice-data.json"];
                if (file) {
                    return JSON.parse(file.content);
                }
            } else if (res.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch gist: ${res.statusText}`);
        } catch (e) {
            console.error("Fetch gist failed", e);
            throw e;
        }
    },

    async uploadGist(token: string, gistId: string | null, data: SyncData): Promise<{ id: string }> {
        const headers = {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        };

        const body = JSON.stringify({
            description: "TabularPractice Data Backup",
            public: false,
            files: {
                "tabular-practice-data.json": {
                    content: JSON.stringify(data, null, 2)
                }
            }
        });

        const url = gistId
            ? `https://api.github.com/gists/${gistId}`
            : "https://api.github.com/gists";

        const method = gistId ? "PATCH" : "POST";

        try {
            const res = await fetch(url, { method, headers, body });
            if (!res.ok) {
                throw new Error(`Sync failed: ${res.statusText}`);
            }
            return await res.json();
        } catch (e) {
            console.error("Upload gist failed", e);
            throw e;
        }
    },

    // Helper to merge data based on timestamps
    mergeData(local: SyncData, remote: SyncData): SyncData {
        const mergedProgress = { ...local.progress };
        const mergedProgressLastModified = { ...(local.progressLastModified || {}) };

        const mergedNotes = { ...local.notes };
        const mergedNotesLastModified = { ...(local.notesLastModified || {}) };

        const mergedTimes = { ...(local.times || {}) };
        const mergedTimesLastModified = { ...(local.timesLastModified || {}) };

        // Merge Progress
        Object.entries(remote.progress).forEach(([id, status]) => {
            const localTime = mergedProgressLastModified[id] || 0;
            const remoteTime = remote.progressLastModified?.[id] || 0;

            // If remote is newer, or we don't have it locally
            if (remoteTime > localTime || !mergedProgress[id]) {
                mergedProgress[id] = status;
                mergedProgressLastModified[id] = remoteTime;
            }
        });

        // Merge Notes
        Object.entries(remote.notes).forEach(([id, content]) => {
            const localTime = mergedNotesLastModified[id] || 0;
            const remoteTime = remote.notesLastModified?.[id] || 0;

            if (remoteTime > localTime || !mergedNotes[id]) {
                mergedNotes[id] = content;
                mergedNotesLastModified[id] = remoteTime;
            }
        });

        // Merge Times
        // Use Math.max to prevent data loss (accumulative nature of time)
        if (remote.times) {
            Object.entries(remote.times).forEach(([id, time]) => {
                const localValue = mergedTimes[id] || 0;
                const remoteValue = time;

                // Always take the larger value
                if (remoteValue > localValue) {
                    mergedTimes[id] = remoteValue;
                    // We take the remote timestamp if we take the remote value, 
                    // or keep local if we keep local. 
                    // But strictly speaking, if we merge (max), the new "value" is the max.
                    // The timestamp should probably reflect the source of the max value.
                    mergedTimesLastModified[id] = remote.timesLastModified?.[id] || Date.now();
                }
            });
        }

        // Merge Stars (Simple merge for now as they are booleans and less critical, or use simple union)
        const mergedStars = { ...remote.stars, ...local.stars };

        // Merge RepoSources
        let newRepoSources = local.repoSources;
        if (remote.repoSources && Array.isArray(remote.repoSources)) {
            const existingUrls = new Set(local.repoSources.map(s => s.url));
            const uniqueNewSources = remote.repoSources.filter(s => !existingUrls.has(s.url));
            newRepoSources = [...local.repoSources, ...uniqueNewSources];
        }

        return {
            version: Math.max(local.version, remote.version),
            timestamp: new Date().toISOString(),
            progress: mergedProgress,
            progressLastModified: mergedProgressLastModified,
            notes: mergedNotes,
            notesLastModified: mergedNotesLastModified,
            times: mergedTimes,
            timesLastModified: mergedTimesLastModified,
            stars: mergedStars,
            repoSources: newRepoSources
        };
    }
};
