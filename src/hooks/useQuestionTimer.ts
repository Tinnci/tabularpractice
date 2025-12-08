import { useEffect, useRef, useCallback } from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';
import { useProgressStore } from '@/lib/store';
import { StudyRecord } from '@/lib/types';

interface UseQuestionTimerProps {
    questionId: string | undefined;
    visibleViews: Set<string>; // 传入当前可见的视图，用于判断是否在"思考"
    isOpen: boolean;
    source?: 'modal' | 'practice' | 'review';  // 来源场景
}

export function useQuestionTimer({
    questionId,
    visibleViews,
    isOpen,
    source = 'modal'
}: UseQuestionTimerProps) {
    const { addTime, addStudyRecord } = useProgressStore();

    // 1. 继承基础计时能力
    const stopwatch = useStopwatch({
        autoStart: true,
        smartPause: true // 保持原有的切屏自动暂停
    });

    const { elapsed, isRunning, start, pause, reset } = stopwatch;
    const activeIdRef = useRef(questionId);
    // 使用 Ref 追踪 elapsed，避免 useEffect 频繁触发
    const elapsedRef = useRef(elapsed);

    // === 新增：Session 元数据追踪 ===
    const sessionStartRef = useRef<number>(Date.now());
    const viewedAnswerRef = useRef(false);
    const viewedAnalysisRef = useRef(false);
    const totalElapsedRef = useRef(0);  // 总时间（包含暂停）

    useEffect(() => {
        elapsedRef.current = elapsed;
    }, [elapsed]);

    // 追踪查看答案/解析的行为
    useEffect(() => {
        if (visibleViews.has('answer')) {
            viewedAnswerRef.current = true;
        }
        if (visibleViews.has('analysis')) {
            viewedAnalysisRef.current = true;
        }
    }, [visibleViews]);

    // 2. 智能暂停逻辑 (Smart Pause)
    // 当用户查看答案、解析或视频时，自动暂停；切回题目时自动继续
    useEffect(() => {
        if (!isOpen || !questionId) return;

        const isReviewing = visibleViews.has('answer') || visibleViews.has('analysis') || visibleViews.has('video');

        if (isReviewing && isRunning) {
            pause();
        } else if (!isReviewing && !isRunning && elapsed > 0) {
            start();
        }
    }, [visibleViews, isRunning, pause, start, elapsed, isOpen, questionId]);

    // Handle browser tab visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isReviewing = visibleViews.has('answer') || visibleViews.has('analysis') || visibleViews.has('video');

            if (document.hidden && isRunning) {
                pause();
            } else if (!document.hidden && !isRunning && !isReviewing && isOpen && questionId) {
                start();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isRunning, pause, start, visibleViews, isOpen, questionId]);

    // 3. 安全保存逻辑 (封装 store 交互)
    const saveTime = useCallback(() => {
        const currentId = activeIdRef.current;
        const thinkingTime = elapsedRef.current;

        // 阈值设为 1秒，避免误触产生垃圾数据
        if (currentId && thinkingTime > 1000) {
            const now = Date.now();
            const totalDuration = now - sessionStartRef.current;

            // 写入累计时间（兼容旧系统）
            addTime(currentId, thinkingTime);

            // 写入详细的 StudyRecord
            const record: Omit<StudyRecord, 'id'> = {
                questionId: currentId,
                startedAt: sessionStartRef.current,
                endedAt: now,
                durationMs: thinkingTime,
                totalDurationMs: totalDuration,
                source,
                viewedAnswer: viewedAnswerRef.current,
                viewedAnalysis: viewedAnalysisRef.current,
            };
            addStudyRecord(record);
        }
    }, [addTime, addStudyRecord, source]);

    // 重置 session 元数据的辅助函数
    const resetSessionMeta = useCallback(() => {
        sessionStartRef.current = Date.now();
        viewedAnswerRef.current = false;
        viewedAnalysisRef.current = false;
        totalElapsedRef.current = 0;
    }, []);

    // 4. 生命周期管理：题目切换前保存、组件卸载前保存
    // [修复] 防止因 questionId 闪烁导致的计时器重置
    useEffect(() => {
        // 只有当新传入的 questionId 有值，且确实与当前记录的 ID 不同时，才视为切换题目
        if (questionId && activeIdRef.current !== questionId) {
            saveTime(); // 保存上一题
            reset(true); // 重置并为新题自动开始
            resetSessionMeta(); // 重置 session 元数据
            activeIdRef.current = questionId;
        }
        // 如果 questionId 变为 undefined (例如加载中)，我们保持 activeIdRef 不变，
        // 这样当它变回原来的 ID 时，不会触发上面的 if，计时器也就不会被重置。
    }, [questionId, saveTime, reset, resetSessionMeta]);

    // 关闭 Modal 时保存
    useEffect(() => {
        if (!isOpen && activeIdRef.current) {
            saveTime();
            reset(false); // 停止计时
        }
    }, [isOpen, saveTime, reset]);

    // 组件卸载时保存 (作为兜底)
    useEffect(() => {
        return () => {
            saveTime();
        };
    }, [saveTime]);

    return stopwatch; // 返回给 UI 层使用
}
