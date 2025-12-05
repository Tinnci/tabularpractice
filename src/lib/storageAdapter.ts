import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

// SSR-safe storage adapter that only uses IndexedDB on the client
export const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        await del(name);
    },
};
