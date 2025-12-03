import { get, set, del, keys, entries, setMany } from 'idb-keyval';

const PREFIX = 'draft-';

export const draftStore = {
    getDraft: async (questionId: string): Promise<string | undefined> => {
        return await get<string>(`${PREFIX}${questionId}`);
    },

    saveDraft: async (questionId: string, content: string): Promise<void> => {
        await set(`${PREFIX}${questionId}`, content);
    },

    deleteDraft: async (questionId: string): Promise<void> => {
        await del(`${PREFIX}${questionId}`);
    },

    getAllDraftIds: async (): Promise<string[]> => {
        const allKeys = await keys();
        return allKeys
            .filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX))
            .map(k => k.replace(PREFIX, ''));
    },

    // Helper to migrate from localStorage if needed
    migrateFromLocalStorage: async (legacyDrafts: Record<string, string>) => {
        const entriesToSave: [string, string][] = Object.entries(legacyDrafts).map(
            ([id, content]) => [`${PREFIX}${id}`, content]
        );
        await setMany(entriesToSave);
    },

    // Export all drafts for backup
    getAllDrafts: async (): Promise<Record<string, string>> => {
        const allEntries = await entries();
        const drafts: Record<string, string> = {};

        for (const [key, value] of allEntries) {
            if (typeof key === 'string' && key.startsWith(PREFIX)) {
                drafts[key.replace(PREFIX, '')] = value as string;
            }
        }
        return drafts;
    },

    // Import drafts from backup
    importDrafts: async (drafts: Record<string, string>) => {
        const entriesToSave: [string, string][] = Object.entries(drafts).map(
            ([id, content]) => [`${PREFIX}${id}`, content]
        );
        await setMany(entriesToSave);
    }
};
