import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStopwatchOptions {
    autoStart?: boolean;
    smartPause?: boolean; // 是否在页面不可见时自动暂停
}

export function useStopwatch({ autoStart = true, smartPause = true }: UseStopwatchOptions = {}) {
    const [elapsed, setElapsed] = useState(0); // 毫秒
    const [isRunning, setIsRunning] = useState(autoStart);
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0); // 暂停时已过去的时间

    const animate = (time: number) => {
        if (startTimeRef.current > 0) {
            setElapsed(savedElapsedRef.current + (time - startTimeRef.current));
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    const start = useCallback(() => {
        if (isRunning) return;
        setIsRunning(true);
        startTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animate);
    }, [isRunning]);

    const pause = useCallback(() => {
        if (!isRunning) return;
        setIsRunning(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        // 保存当前流逝的时间
        savedElapsedRef.current = elapsed;
        startTimeRef.current = 0;
    }, [isRunning, elapsed]);

    const reset = useCallback(() => {
        setIsRunning(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setElapsed(0);
        savedElapsedRef.current = 0;
        startTimeRef.current = 0;
        // 如果需要重置后立即开始，可以在这里调用 start()
    }, []);

    const toggle = useCallback(() => {
        isRunning ? pause() : start();
    }, [isRunning, pause, start]);

    // 智能暂停逻辑：监听页面可见性
    useEffect(() => {
        if (!smartPause) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // 页面隐藏，如果正在运行则暂停，并标记是由系统暂停的（可选逻辑）
                if (isRunning) {
                    pause();
                    // 这里可以加一个 toast 提示 "计时已自动暂停"
                }
            } else {
                // 页面恢复，可选逻辑：自动恢复或保持暂停
                // 考研刷题场景下，建议保持暂停，让用户手动点开始，或者自动恢复
                // 这里演示自动恢复逻辑：(需要引入额外的ref来记录是否是被系统暂停的，略简化)
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [smartPause, isRunning, pause]);

    // 清理
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // 格式化时间显示 (MM:SS)
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return {
        elapsed,
        formattedTime: formatTime(elapsed),
        isRunning,
        start,
        pause,
        reset,
        toggle
    };
}
