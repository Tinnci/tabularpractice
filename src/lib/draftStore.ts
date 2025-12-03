import { get, set, del, keys } from 'idb-keyval';

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
    const promises = Object.entries(legacyDrafts).map(([id, content]) => 
      set(`${PREFIX}${id}`, content)
    );
    await Promise.all(promises);
  }
};
