import { StateCreator } from 'zustand';
import { Status } from '@/lib/types';
import { StoreState } from '../types';

export interface UISlice {
    mobileSidebarOpen: boolean;

    // Filters
    selectedTagId: string | null;
    currentGroupId: string;
    lastQuestionId: string | null;
    filterSubject: 'math' | 'english' | 'politics';
    filterStatus: Status | 'all';
    filterType: 'all' | 'choice' | 'fill' | 'answer';
    filterYear: 'all' | string;
    filterStarred: boolean;
    viewMode: 'wall' | 'grid'; // View switcher state

    setMobileSidebarOpen: (open: boolean) => void;
    setSelectedTagId: (id: string | null) => void;
    setCurrentGroupId: (id: string) => void;
    setLastQuestionId: (id: string | null) => void;
    setFilterStatus: (status: Status | 'all') => void;
    setFilterType: (type: 'all' | 'choice' | 'fill' | 'answer') => void;
    setFilterYear: (year: 'all' | string) => void;
    setFilterStarred: (starred: boolean) => void;
    setViewMode: (mode: 'wall' | 'grid') => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
    mobileSidebarOpen: false,
    selectedTagId: null,
    currentGroupId: 'math1',
    lastQuestionId: null,
    filterSubject: 'math',
    filterStatus: 'all',
    filterType: 'all',
    filterYear: 'all',
    filterStarred: false,
    viewMode: 'wall',

    setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    setSelectedTagId: (id) => set({ selectedTagId: id }),

    setCurrentGroupId: (id) => {
        let subject: 'math' | 'english' | 'politics' = 'math';
        if (id.startsWith('english')) subject = 'english';
        else if (id.startsWith('politics')) subject = 'politics';

        set({
            currentGroupId: id,
            selectedTagId: null,
            filterSubject: subject
        });
    },

    setLastQuestionId: (id) => set({ lastQuestionId: id }),
    setFilterStatus: (status) => set({ filterStatus: status }),
    setFilterType: (type) => set({ filterType: type }),
    setFilterYear: (year) => set({ filterYear: year }),
    setFilterStarred: (starred) => set({ filterStarred: starred }),
    setViewMode: (mode) => set({ viewMode: mode }),
});
