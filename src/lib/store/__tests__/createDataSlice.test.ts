import { describe, it, expect, beforeEach } from 'bun:test';
import { useProgressStore } from '../index';

describe('createDataSlice', () => {
    beforeEach(() => {
        // Reset store to clean state
        useProgressStore.setState({
            progress: {},
            progressLastModified: {},
            notes: {},
            notesLastModified: {},
            times: {},
            timesLastModified: {},
            stars: {},
            history: {},
        });
    });

    describe('updateStatus', () => {
        it('should update question status', () => {
            const { updateStatus } = useProgressStore.getState();

            updateStatus('q1', 'mastered');

            const state = useProgressStore.getState();
            expect(state.progress['q1']).toBe('mastered');
            expect(state.progressLastModified['q1']).toBeGreaterThan(0);
        });

        it('should update history count when status changes', () => {
            const { updateStatus } = useProgressStore.getState();

            updateStatus('q1', 'mastered');

            const state = useProgressStore.getState();
            const today = new Date().toISOString().split('T')[0];

            expect(state.history[today]).toBe(1);
        });

        it('should not increment history for unanswered status', () => {
            const { updateStatus } = useProgressStore.getState();

            updateStatus('q1', 'unanswered');

            const state = useProgressStore.getState();
            const today = new Date().toISOString().split('T')[0];

            expect(state.history[today]).toBeUndefined();
        });

        it('should accumulate daily history', () => {
            const { updateStatus } = useProgressStore.getState();

            updateStatus('q1', 'mastered');
            updateStatus('q2', 'confused');
            updateStatus('q3', 'failed');

            const state = useProgressStore.getState();
            const today = new Date().toISOString().split('T')[0];

            expect(state.history[today]).toBe(3);
        });
    });

    describe('updateNote', () => {
        it('should add/update note content', () => {
            const { updateNote } = useProgressStore.getState();

            updateNote('q1', 'This is a note');

            const state = useProgressStore.getState();
            expect(state.notes['q1']).toBe('This is a note');
            expect(state.notesLastModified['q1']).toBeGreaterThan(0);
        });

        it('should overwrite existing note', () => {
            const { updateNote } = useProgressStore.getState();

            updateNote('q1', 'First note');
            updateNote('q1', 'Updated note');

            const state = useProgressStore.getState();
            expect(state.notes['q1']).toBe('Updated note');
        });
    });

    describe('addTime', () => {
        it('should add time to question', () => {
            const { addTime } = useProgressStore.getState();

            addTime('q1', 5000); // 5 seconds

            const state = useProgressStore.getState();
            expect(state.times['q1']).toBe(5000);
            expect(state.timesLastModified['q1']).toBeGreaterThan(0);
        });

        it('should accumulate time correctly', () => {
            const { addTime } = useProgressStore.getState();

            addTime('q1', 3000);
            addTime('q1', 2000);

            const state = useProgressStore.getState();
            expect(state.times['q1']).toBe(5000);
        });
    });

    describe('setTime', () => {
        it('should set absolute time value', () => {
            const { setTime } = useProgressStore.getState();

            setTime('q1', 10000);

            const state = useProgressStore.getState();
            expect(state.times['q1']).toBe(10000);
        });

        it('should not allow negative time', () => {
            const { setTime } = useProgressStore.getState();

            setTime('q1', -1000);

            const state = useProgressStore.getState();
            expect(state.times['q1']).toBe(0);
        });

        it('should overwrite existing time', () => {
            const { addTime, setTime } = useProgressStore.getState();

            addTime('q1', 5000);
            setTime('q1', 3000);

            const state = useProgressStore.getState();
            expect(state.times['q1']).toBe(3000);
        });
    });

    describe('toggleStar', () => {
        it('should star a question', () => {
            const { toggleStar } = useProgressStore.getState();

            toggleStar('q1');

            const state = useProgressStore.getState();
            expect(state.stars['q1']).toBe(true);
        });

        it('should unstar a starred question', () => {
            const { toggleStar } = useProgressStore.getState();

            toggleStar('q1');
            toggleStar('q1');

            const state = useProgressStore.getState();
            expect(state.stars['q1']).toBeUndefined();
        });
    });

    describe('getStats', () => {
        it('should calculate statistics correctly', () => {
            const { updateStatus, getStats } = useProgressStore.getState();

            updateStatus('q1', 'mastered');
            updateStatus('q2', 'mastered');
            updateStatus('q3', 'confused');
            updateStatus('q4', 'failed');

            const stats = getStats();

            expect(stats.mastered).toBe(2);
            expect(stats.confused).toBe(1);
            expect(stats.failed).toBe(1);
            expect(stats.total).toBe(4);
        });

        it('should return zero stats for empty progress', () => {
            const { getStats } = useProgressStore.getState();

            const stats = getStats();

            expect(stats.mastered).toBe(0);
            expect(stats.confused).toBe(0);
            expect(stats.failed).toBe(0);
            expect(stats.total).toBe(0);
        });
    });

    describe('import/export', () => {
        it('should get sync snapshot correctly', () => {
            const { updateStatus, updateNote, addTime, getSyncSnapshot } = useProgressStore.getState();

            updateStatus('q1', 'mastered');
            updateNote('q1', 'note');
            addTime('q1', 5000);

            const snapshot = getSyncSnapshot();

            expect(snapshot.progress).toEqual({ 'q1': 'mastered' });
            expect(snapshot.notes).toEqual({ 'q1': 'note' });
            expect(snapshot.times).toEqual({ 'q1': 5000 });
        });
    });
});
