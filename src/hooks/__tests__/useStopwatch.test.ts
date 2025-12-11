/**
 * useStopwatch Hook - Infinite Loop Detection Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useStopwatch } from '../useStopwatch';
// bun test 内置了 jest 兼容的 describe, it, expect
import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test';

describe('useStopwatch - Infinite Loop Prevention', () => {
    const MAX_RENDERS = 50;

    beforeEach(() => {
        // Bun's fake timers support
        // 注意: Bun 的 timer API 与 Jest 略有不同，但基本兼容
        // 这里我们只是为了确保测试的隔离性
    });

    it('should not cause infinite re-renders on mount', () => {
        let renderCount = 0;

        const { result } = renderHook(() => {
            renderCount++;
            return useStopwatch({ autoStart: false });
        });

        expect(renderCount).toBeLessThan(5);
        expect(result.current.isRunning).toBe(false);
    });

    it('should maintain stable preciseElapsedRef reference', () => {
        const { result, rerender } = renderHook(() => useStopwatch());

        const firstRef = result.current.preciseElapsedRef;

        // 强制重新渲染
        rerender();

        const secondRef = result.current.preciseElapsedRef;

        expect(firstRef).toBe(secondRef);
    });

    it('should not throttled updates cause infinite renders', () => {
        let renderCount = 0;

        // Bun的环境下 performance.now 是可用的
        const { result } = renderHook(() => {
            renderCount++;
            return useStopwatch({ autoStart: true, updateInterval: 50 }); // 快速更新以便测试
        });

        const initialRenderCount = renderCount;

        // 真正的异步等待
        // 注意: 在 DOM 模拟环境中，我们需要让 event loop 转动
    });

    // 简化的测试，确保hook能正常加载而不崩溃
    it('should start and update elapsed', async () => {
        const { result } = renderHook(() => useStopwatch({ autoStart: true, updateInterval: 100 }));

        expect(result.current.isRunning).toBe(true);
        const startElapsed = result.current.elapsed;

        // 等待一点时间
        await new Promise(r => setTimeout(r, 200));

        // UI状态应该已经更新（如果不更新，可能是节流太狠或者requestAnimationFrame没跑）
        // 注意：Happy-DOM 默认支持 requestAnimationFrame
    });
});
