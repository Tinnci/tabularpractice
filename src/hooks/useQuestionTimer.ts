import { useEffect, useRef, useCallback } from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';
import { useProgressStore } from '@/lib/store';

interface UseQuestionTimerProps {
    questionId: string | undefined;
    visibleViews: Set<string>; // 传入当前可见的视图集合
    enabled?: boolean;
}

export function useQuestionTimer({ questionId, visibleViews, enabled = true }: UseQuestionTimerProps) {
    const { addTime } = useProgressStore();

    // 使用现有的 useStopwatch
    const stopwatch = useStopwatch({
        autoStart: true,
        smartPause: true
    });

    const { elapsed, isRunning, pause, reset } = stopwatch;

    // 记录当前正在计时的题目ID
    const activeIdRef = useRef(questionId);
    // 使用 Ref 追踪 elapsed，避免 useEffect 频繁触发
    const elapsedRef = useRef(elapsed);

    useEffect(() => {
        elapsedRef.current = elapsed;
    }, [elapsed]);

    // 1. 智能暂停逻辑：当查看答案/解析/视频时，自动暂停
    useEffect(() => {
        if (!enabled) return;

        const isReviewing = visibleViews.has('answer') || visibleViews.has('analysis') || visibleViews.has('video');

        if (isReviewing && isRunning) {
            pause();
        }
        // 可选：切回题目时是否自动开始？目前保持暂停，由用户决定或切换题目时自动重置开始
    }, [visibleViews, isRunning, pause, enabled]);

    // 2. 自动保存逻辑
    const saveTime = useCallback(() => {
        const currentId = activeIdRef.current;
        // 只有当时间 > 1秒 时才保存
        if (currentId && elapsedRef.current > 1000) {
            addTime(currentId, elapsedRef.current);
        }
    }, [addTime]);

    // 3. 题目切换处理
    useEffect(() => {
        // 题目 ID 变化前，保存上一题的时间
        if (activeIdRef.current !== questionId) {
            saveTime();
            reset(true); // 重置并自动开始下一题
            activeIdRef.current = questionId;
        }
    }, [questionId, saveTime, reset]);

    // 组件卸载/关闭 Modal 时保存
    useEffect(() => {
        return () => {
            saveTime();
        };
    }, [saveTime]);

    return stopwatch;
}
