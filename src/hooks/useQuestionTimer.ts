import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';
import { useProgressStore } from '@/lib/store';
import { StudyRecord } from '@/lib/types';

interface UseQuestionTimerProps {
    questionId: string | undefined;
    visibleViews: Set<string>; // 传入当前可见的视图，用于判断是否在"思考"
    isOpen: boolean;
    source?: 'modal' | 'practice' | 'review';  // 来源场景
}

interface QuestionTimerResult {
    // 基础计时器状态
    elapsed: number;
    isRunning: boolean;
    formattedTime: string;
    toggle: () => void;
    reset: (autoStart?: boolean) => void;
    start: () => void;
    pause: () => void;

    // 增强状态
    historicalTime: number;           // 历史累计时间 (ms)
    totalTime: number;                // 历史 + 本次
    formattedTotalTime: string;       // 格式化的总时间
    formattedHistoricalTime: string;  // 格式化的历史时间
    hasHistory: boolean;              // 是否有历史记录
    questionStatus: string | null;    // 题目当前状态
}

export function useQuestionTimer({
    questionId,
    visibleViews,
    isOpen,
    source = 'modal'
}: UseQuestionTimerProps): QuestionTimerResult {
    const { addTime, addStudyRecord, progress, times } = useProgressStore();

    // 获取题目的历史状态和累计时间
    const questionStatus = questionId ? progress[questionId] || null : null;
    const historicalTime = questionId ? times[questionId] || 0 : 0;
    const hasHistory = historicalTime > 0 || !!questionStatus;

    // 已刷过的题目不自动开始计时
    const shouldAutoStart = !hasHistory;

    // 1. 继承基础计时能力
    const stopwatch = useStopwatch({
        autoStart: shouldAutoStart,
        smartPause: true // 保持原有的切屏自动暂停
    });

    const { elapsed, isRunning, start, pause, reset, preciseElapsedRef } = stopwatch;
    const activeIdRef = useRef(questionId);

    // === 新增：Session 元数据追踪 ===
    const sessionStartRef = useRef<number>(0);
    const viewedAnswerRef = useRef(false);
    const viewedAnalysisRef = useRef(false);
    const totalElapsedRef = useRef(0);  // 总时间（包含暂停）
    const initializedRef = useRef(false);

    // 初始化 sessionStartRef (仅在首次挂载时)
    useEffect(() => {
        if (!initializedRef.current) {
            sessionStartRef.current = Date.now();
            initializedRef.current = true;
        }
    }, []);

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

    // [优化] 移除了重复的 visibilitychange 监听，由 useStopwatch 统一处理

    // 3. 安全保存逻辑 (封装 store 交互)
    const saveTime = useCallback(() => {
        const currentId = activeIdRef.current;
        // 使用高精度的 elapsed 值进行保存
        const thinkingTime = preciseElapsedRef.current;

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
    }, [addTime, addStudyRecord, source, preciseElapsedRef]);

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

            // 检查新题目是否有历史记录
            const newHasHistory = (times[questionId] || 0) > 0 || !!progress[questionId];
            reset(!newHasHistory); // 有历史的不自动开始

            resetSessionMeta(); // 重置 session 元数据
            activeIdRef.current = questionId;
        }
        // 如果 questionId 变为 undefined (例如加载中)，我们保持 activeIdRef 不变，
        // 这样当它变回原来的 ID 时，不会触发上面的 if，计时器也就不会被重置。
    }, [questionId, saveTime, reset, resetSessionMeta, times, progress]);

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

    // 格式化时间辅助函数
    const formatTime = useCallback((ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, []);

    // 计算总时间 = 历史累计 + 本次
    const totalTime = historicalTime + elapsed;

    // 格式化的时间
    const formattedTotalTime = useMemo(() => formatTime(totalTime), [formatTime, totalTime]);
    const formattedHistoricalTime = useMemo(() => formatTime(historicalTime), [formatTime, historicalTime]);

    return {
        // 基础计时器状态
        elapsed,
        isRunning,
        formattedTime: stopwatch.formattedTime,
        toggle: stopwatch.toggle,
        reset,
        start,
        pause,

        // 增强状态
        historicalTime,
        totalTime,
        formattedTotalTime,
        formattedHistoricalTime,
        hasHistory,
        questionStatus,
    };
}
