import { StateCreator } from 'zustand';
import { Status, NotesMap, Question, Paper, PaperGroup, PracticeSession } from '@/lib/types';
import { SyncData } from '@/services/syncService';
import { StoreState } from '../types';

export interface DataSlice {
    progress: Record<string, Status>;
    progressLastModified: Record<string, number>;
    notes: NotesMap;
    notesLastModified: Record<string, number>;
    times: Record<string, number>;
    timesLastModified: Record<string, number>;
    stars: Record<string, boolean>;
    history: Record<string, number>;

    customQuestions: Record<string, Question>;
    customPapers: Record<string, Paper>;
    customPaperGroups: Record<string, PaperGroup>;

    practiceSession: PracticeSession | null;

    updateStatus: (id: string, status: Status) => void;
    updateNote: (id: string, content: string) => void;
    addTime: (id: string, delta: number) => void;
    toggleStar: (id: string) => void;
    getStats: () => { mastered: number; confused: number; failed: number; total: number };

    addCustomData: (data: { questions?: Question[], papers?: Paper[], groups?: PaperGroup[] }) => void;
    setPracticeSession: (session: PracticeSession | null) => void;
    updatePracticeSessionProgress: (index: number) => void;

    importData: (data: unknown) => void;
    importProgress: (newProgress: Record<string, Status>) => void;
}

export const createDataSlice: StateCreator<StoreState, [], [], DataSlice> = (set, get) => ({
    progress: {},
    progressLastModified: {},
    notes: {},
    notesLastModified: {},
    times: {},
    timesLastModified: {},
    stars: {},
    history: {},
    customQuestions: {},
    customPapers: {},
    customPaperGroups: {},
    practiceSession: null,

    updateStatus: (id, status) => {
        set((state) => {
            const today = new Date().toISOString().split('T')[0];
            const currentCount = state.history[today] || 0;

            const newHistory = { ...state.history };
            if (status !== 'unanswered') {
                newHistory[today] = currentCount + 1;
            }

            return {
                progress: { ...state.progress, [id]: status },
                progressLastModified: { ...state.progressLastModified, [id]: Date.now() },
                history: newHistory
            };
        });
        get().triggerAutoSync();
    },

    updateNote: (id, content) => {
        set((state) => ({
            notes: { ...state.notes, [id]: content },
            notesLastModified: { ...state.notesLastModified, [id]: Date.now() }
        }));
        get().triggerAutoSync();
    },

    addTime: (id, delta) => {
        set((state) => {
            const currentTime = state.times[id] || 0;
            return {
                times: { ...state.times, [id]: currentTime + delta },
                timesLastModified: { ...state.timesLastModified, [id]: Date.now() }
            };
        });
        get().triggerAutoSync();
    },

    toggleStar: (id) => {
        set((state) => {
            const newStars = { ...state.stars };
            if (newStars[id]) {
                delete newStars[id];
            } else {
                newStars[id] = true;
            }
            return { stars: newStars };
        });
        get().triggerAutoSync();
    },

    getStats: () => {
        const values = Object.values(get().progress);
        return {
            mastered: values.filter(s => s === 'mastered').length,
            confused: values.filter(s => s === 'confused').length,
            failed: values.filter(s => s === 'failed').length,
            total: values.length
        };
    },

    addCustomData: ({ questions = [], papers = [], groups = [] }) => set((state) => {
        const newQuestions = { ...state.customQuestions };
        questions.forEach(q => newQuestions[q.id] = q);

        const newPapers = { ...state.customPapers };
        papers.forEach(p => newPapers[p.id] = p);

        const newGroups = { ...state.customPaperGroups };
        groups.forEach(g => newGroups[g.id] = g);

        return {
            customQuestions: newQuestions,
            customPapers: newPapers,
            customPaperGroups: newGroups
        };
    }),

    setPracticeSession: (session) => set({ practiceSession: session }),

    updatePracticeSessionProgress: (index) => set((state) => {
        if (state.practiceSession) {
            return {
                practiceSession: {
                    ...state.practiceSession,
                    currentIndex: index
                }
            };
        }
        return {};
    }),

    importData: (data) => {
        const isNewFormat = (d: unknown): d is SyncData => {
            return typeof d === 'object' && d !== null && 'progress' in d;
        };

        if (isNewFormat(data)) {
            set((state) => {
                let newRepoSources = state.repoSources;
                if (data.repoSources && Array.isArray(data.repoSources)) {
                    const existingUrls = new Set(state.repoSources.map(s => s.url));
                    const uniqueNewSources = data.repoSources.filter(s => !existingUrls.has(s.url));
                    newRepoSources = [...state.repoSources, ...uniqueNewSources];
                }

                return {
                    progress: data.progress,
                    progressLastModified: data.progressLastModified || {},
                    notes: data.notes || {},
                    notesLastModified: data.notesLastModified || {},
                    times: data.times || {},
                    timesLastModified: data.timesLastModified || {},
                    stars: data.stars || {},
                    repoSources: newRepoSources
                };
            });
        } else {
            set({ progress: data as Record<string, Status> });
        }
    },

    importProgress: (newProgress) => set({ progress: newProgress }),
});
