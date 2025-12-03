import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseStopwatchOptions {
    autoStart?: boolean;
    smartPause?: boolean; // 是否在页面不可见时自动暂停
}

export function useStopwatch({ autoStart = true, smartPause = true }: UseStopwatchOptions = {}) {
    const [elapsed, setElapsed] = useState(0); // 毫秒
    const [isRunning, setIsRunning] = useState(autoStart);
    const [isSmartPaused, setIsSmartPaused] = useState(false); // 标记是否是因为切屏导致的暂停

    const startTimeRef = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0); // 暂停时已过去的时间
    const requestRef = useRef<number | null>(null);
    const animateRef = useRef<(() => void) | null>(null);

    // 动画循环
    const animate = useCallback(() => {
        if (startTimeRef.current > 0) {
            const now = performance.now();
            setElapsed(savedElapsedRef.current + (now - startTimeRef.current));
        }
        if (animateRef.current) {
            requestRef.current = requestAnimationFrame(animateRef.current);
        }
    }, []);

    // 更新 animateRef
    useEffect(() => {
        animateRef.current = animate;
    }, [animate]);

    // 开始/继续
    const start = useCallback(() => {
        setIsRunning(true);
        startTimeRef.current = performance.now();
        if (animateRef.current) {
            requestRef.current = requestAnimationFrame(animateRef.current);
        }
    }, []);

    // 暂停
    const pause = useCallback(() => {
        setIsRunning(false);
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        // 保存当前流逝的时间，防止下次 start 时时间跳变
        if (startTimeRef.current > 0) {
            savedElapsedRef.current += performance.now() - startTimeRef.current;
        }
        startTimeRef.current = 0;
    }, []);

    // 重置
    const reset = useCallback((newAutoStart = false) => {
        setIsRunning(newAutoStart);
        setElapsed(0);
        savedElapsedRef.current = 0;
        startTimeRef.current = newAutoStart ? performance.now() : 0;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (newAutoStart && animateRef.current) {
            requestRef.current = requestAnimationFrame(animateRef.current);
        }
    }, []);

    // 智能暂停逻辑 (Page Visibility API)
    useEffect(() => {
        if (!smartPause) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // 页面隐藏：如果是运行状态，则暂停，并标记为“智能暂停”
                if (isRunning) {
                    pause();
                    setIsRunning(true); // 保持逻辑状态为运行，只是物理暂停
                    setIsSmartPaused(true);
                }
            } else {
                // 页面恢复：如果是“智能暂停”状态，则自动恢复
                if (isSmartPaused) {
                    start();
                    setIsSmartPaused(false);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [smartPause, isRunning, isSmartPaused, pause, start]);

    // 启动/清理
    useEffect(() => {
        if (autoStart) {
            startTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [autoStart, animate]);

    // 切换
    const toggle = useCallback(() => {
        if (isRunning) {
            pause();
        } else {
            start();
        }
    }, [isRunning, pause, start]);

    // 格式化时间
    const formattedTime = useMemo(() => {
        const totalSeconds = Math.floor(elapsed / 1000);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, [elapsed]);

    return { elapsed, isRunning, start, pause, reset, toggle, formattedTime };
}
