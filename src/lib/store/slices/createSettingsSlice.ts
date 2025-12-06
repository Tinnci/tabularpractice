import { StateCreator } from 'zustand';
import { RepoSource } from '@/lib/types';
import { StoreState } from '../types';

export interface SettingsSlice {
    repoSources: RepoSource[];
    lowDataMode: boolean;
    appearance: {
        cardWidth: number;
        cardHeight: number;
        columnSpacing: number;
        rowSpacing: number;
        heightMode: 'fixed' | 'auto';
        compactMode: boolean;
    };
    geminiApiKey: string | null;

    // Deprecated but kept for compatibility
    repoBaseUrl: string;

    addRepoSource: (name: string, url: string) => void;
    removeRepoSource: (id: string) => void;
    toggleRepoSource: (id: string, enabled: boolean) => void;
    setLowDataMode: (enabled: boolean) => void;
    setAppearance: (settings: Partial<SettingsSlice['appearance']>) => void;
    setGeminiApiKey: (key: string | null) => void;
    setRepoBaseUrl: (url: string) => void;

    hiddenPaperIds: string[];
    togglePaperVisibility: (paperId: string) => void;
}

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsSlice> = (set, get) => ({
    repoSources: [
        { id: 'local', name: '内置题库', url: '', enabled: true, isBuiltin: true },
        { id: 'default-remote', name: '题库1 (GitHub)', url: 'https://raw.githubusercontent.com/Tinnci/tabularpractice-data/main', enabled: true, isBuiltin: false }
    ],
    lowDataMode: false,
    appearance: {
        cardWidth: 192,
        cardHeight: 64,
        columnSpacing: 0,
        rowSpacing: 0,
        heightMode: 'auto',
        compactMode: true,
    },
    geminiApiKey: null,
    repoBaseUrl: '',
    hiddenPaperIds: [],

    addRepoSource: (name, url) => {
        set((state) => ({
            repoSources: [
                ...state.repoSources,
                { id: crypto.randomUUID(), name, url, enabled: true }
            ]
        }));
        get().triggerAutoSync();
    },

    removeRepoSource: (id) => {
        set((state) => ({
            repoSources: state.repoSources.filter(s => s.id !== id)
        }));
        get().triggerAutoSync();
    },

    toggleRepoSource: (id, enabled) => {
        set((state) => ({
            repoSources: state.repoSources.map(s =>
                s.id === id ? { ...s, enabled } : s
            )
        }));
        get().triggerAutoSync();
    },

    setLowDataMode: (enabled) => set({ lowDataMode: enabled }),

    setAppearance: (settings) => set((state) => ({
        appearance: { ...state.appearance, ...settings }
    })),

    setGeminiApiKey: (key) => set({ geminiApiKey: key }),

    setRepoBaseUrl: (url) => set({ repoBaseUrl: url }),

    togglePaperVisibility: (paperId) => set((state) => {
        const isHidden = state.hiddenPaperIds.includes(paperId);
        return {
            hiddenPaperIds: isHidden
                ? state.hiddenPaperIds.filter(id => id !== paperId)
                : [...state.hiddenPaperIds, paperId]
        };
    }),
});
