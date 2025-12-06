import { Status, NotesMap, RepoSource, Question, Paper, PaperGroup } from '@/lib/types';

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

    // New fields for comprehensive sync
    history?: Record<string, number>;
    customQuestions?: Record<string, Question>;
    customPapers?: Record<string, Paper>;
    customPaperGroups?: Record<string, PaperGroup>;
}

import { SyncDataSchema } from '@/lib/schema';

export const syncService = {
    async fetchGist(token: string, gistId: string): Promise<SyncData & { updated_at?: string } | null> {
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
                    const jsonContent = JSON.parse(file.content);
                    // Validate data using Zod schema
                    const parsed = SyncDataSchema.safeParse(jsonContent);
                    if (!parsed.success) {
                        console.error("Sync data validation failed:", parsed.error);
                        throw new Error("Invalid sync data format");
                    }
                    return { ...parsed.data as SyncData, updated_at: gist.updated_at };
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

    async uploadGist(token: string, gistId: string | null, data: SyncData): Promise<{ id: string, updated_at: string }> {
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
            const json = await res.json();
            return { id: json.id, updated_at: json.updated_at };
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

            // If remote is newer
            if (remoteTime > localTime) {
                mergedProgress[id] = status;
                mergedProgressLastModified[id] = remoteTime;
            }
        });

        // Merge Notes
        Object.entries(remote.notes).forEach(([id, content]) => {
            const localTime = mergedNotesLastModified[id] || 0;
            const remoteTime = remote.notesLastModified?.[id] || 0;

            // If remote is newer
            // Note: We strictly follow timestamp to handle "soft deletes" (empty values) correctly.
            // If local is missing (0) and remote is present (>0), remote wins.
            // If local is present (>remote) and remote is old, local wins.
            if (remoteTime > localTime) {
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

                // Always take the larger value (Max Strategy)
                // Note: This is a safe heuristic to avoid data loss (rollback), but it doesn't support 
                // true incremental sync (e.g. adding 5s from device A and 5s from device B = 10s).
                // To support that, we would need to track 'lastSyncedValue' in the schema.
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

        // Merge History (Max Strategy)
        const mergedHistory = { ...(local.history || {}) };
        if (remote.history) {
            Object.entries(remote.history).forEach(([date, count]) => {
                const localCount = mergedHistory[date] || 0;
                if (count > localCount) {
                    mergedHistory[date] = count;
                }
            });
        }

        // Merge Stars (Simple merge)
        const mergedStars = { ...remote.stars, ...local.stars };

        // Merge Custom Data
        // Union strategy: remote overwrites local if ID matches, but we keep unique items from both
        const mergedCustomQuestions = { ...(local.customQuestions || {}), ...(remote.customQuestions || {}) };
        const mergedCustomPapers = { ...(local.customPapers || {}), ...(remote.customPapers || {}) };
        const mergedCustomPaperGroups = { ...(local.customPaperGroups || {}), ...(remote.customPaperGroups || {}) };

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
            history: mergedHistory,
            customQuestions: mergedCustomQuestions,
            customPapers: mergedCustomPapers,
            customPaperGroups: mergedCustomPaperGroups,
            repoSources: newRepoSources
        };
    }
};
