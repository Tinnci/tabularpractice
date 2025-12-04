import { StateCreator } from 'zustand';
import { Status, NotesMap, Question, Paper, PaperGroup, PracticeSession } from '@/lib/types';
import { syncService, SyncData } from '@/services/syncService';
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
            const date = new Date();
            const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    },

    updateNote: (id, content) => {
        set((state) => ({
            notes: { ...state.notes, [id]: content },
            notesLastModified: { ...state.notesLastModified, [id]: Date.now() }
        }));

    },

    addTime: (id, delta) => {
        set((state) => {
            const currentTime = state.times[id] || 0;
            return {
                times: { ...state.times, [id]: currentTime + delta },
                timesLastModified: { ...state.timesLastModified, [id]: Date.now() }
            };
        });

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
                // Construct SyncData from current state to perform a safe merge
                const currentLocalData: SyncData = {
                    version: 3,
                    timestamp: new Date().toISOString(),
                    progress: state.progress,
                    progressLastModified: state.progressLastModified,
                    notes: state.notes,
                    notesLastModified: state.notesLastModified,
                    times: state.times,
                    timesLastModified: state.timesLastModified,
                    stars: state.stars,
                    repoSources: state.repoSources
                };

                // Merge current local data with the incoming data
                // This handles the race condition where local state might have changed during sync
                const merged = syncService.mergeData(currentLocalData, data);

                return {
                    progress: merged.progress,
                    progressLastModified: merged.progressLastModified,
                    notes: merged.notes,
                    notesLastModified: merged.notesLastModified,
                    times: merged.times,
                    timesLastModified: merged.timesLastModified,
                    stars: merged.stars,
                    repoSources: merged.repoSources
                };
            });
        } else {
            // Legacy format: overwrite progress as we can't merge reliably without timestamps
            set({ progress: data as Record<string, Status> });
        }
    },

    importProgress: (newProgress) => set({ progress: newProgress }),
});
