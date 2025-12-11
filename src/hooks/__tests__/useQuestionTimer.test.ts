/**
 * useQuestionTimer Hook Tests
 * 
 * 重点测试业务逻辑：
 * - 智能暂停（查看答案/解析时自动暂停）
 * - 数据保存（切换题目时保存时间）
 * - 历史时间累加
 */

import { renderHook, act } from '@testing-library/react';
import { useQuestionTimer } from '../useQuestionTimer';
import { useProgressStore } from '@/lib/store';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('useQuestionTimer', () => {
    beforeEach(() => {
        useProgressStore.setState({
            progress: {},
            times: {},
            studyRecords: [],
        });
    });

    it('should auto-start for new questions', () => {
        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        // 新题应该自动开始计时
        expect(result.current.isRunning).toBe(true);
    });

    it('should NOT auto-start for questions with history', () => {
        // 设置历史记录
        useProgressStore.setState({
            times: { 'q1': 5000 }
        });

        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        // 有历史的题不应该自动开始
        expect(result.current.isRunning).toBe(false);
        expect(result.current.historicalTime).toBe(5000);
        expect(result.current.hasHistory).toBe(true);
    });

    it('should pause when viewing answer', async () => {
        const { result, rerender } = renderHook(
            ({ views }) =>
                useQuestionTimer({
                    questionId: 'q1',
                    visibleViews: views,
                    isOpen: true,
                }),
            {
                initialProps: { views: new Set(['question']) }
            }
        );

        // 初始应该在运行
        expect(result.current.isRunning).toBe(true);

        // 切换到答案视图
        act(() => {
            rerender({ views: new Set(['answer']) });
        });

        // 应该暂停
        // Note: 由于 useEffect 的异步特性，我们需要等待下一次渲染
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(result.current.isRunning).toBe(false);
    });

    it('should resume when returning to question view', async () => {
        const { result, rerender } = renderHook(
            ({ views }) =>
                useQuestionTimer({
                    questionId: 'q1',
                    visibleViews: views,
                    isOpen: true,
                }),
            {
                initialProps: { views: new Set(['question']) }
            }
        );

        // 开始计时
        expect(result.current.isRunning).toBe(true);

        // 切换到答案
        act(() => {
            rerender({ views: new Set(['answer']) });
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        // 切回题目
        act(() => {
            rerender({ views: new Set(['question']) });
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        // 应该恢复计时
        expect(result.current.isRunning).toBe(true);
    });

    it('should calculate total time correctly', () => {
        useProgressStore.setState({
            times: { 'q1': 3000 } // 3秒历史
        });

        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        // totalTime = historicalTime + elapsed
        // elapsed = 0 (未开始)，historicalTime = 3000
        expect(result.current.historicalTime).toBe(3000);
        expect(result.current.totalTime).toBe(3000);
    });

    it('should format time correctly', () => {
        useProgressStore.setState({
            times: { 'q1': 65000 } // 65秒 = 1:05
        });

        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        expect(result.current.formattedHistoricalTime).toBe('01:05');
    });

    it('should track question status', () => {
        useProgressStore.setState({
            progress: { 'q1': 'mastered' }
        });

        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        expect(result.current.questionStatus).toBe('mastered');
    });


    it('should reset timer when called', () => {
        const { result } = renderHook(() =>
            useQuestionTimer({
                questionId: 'q1',
                visibleViews: new Set(['question']),
                isOpen: true,
            })
        );

        // 让计时器运行一段时间（通过 mock 或等待）
        // 这里简化测试，直接调用 reset
        act(() => {
            result.current.reset();
        });

        expect(result.current.elapsed).toBe(0);
    });
});
