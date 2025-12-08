# 学习分析系统设计文档

## 1. 设计目标

构建一个面向长远、可扩展的学习分析系统，支持：
- 详细的做题记录追溯
- 多维度的学习统计
- 时间投入趋势分析
- 学习效率评估

## 2. 数据模型设计

### 2.1 核心类型 (src/lib/types.ts)

```typescript
// 单次做题记录
interface PracticeSession {
    id: string;           // 唯一标识 (nanoid)
    questionId: string;   // 题目ID
    startedAt: number;    // 开始时间戳
    endedAt: number;      // 结束时间戳
    durationMs: number;   // 实际用时（扣除暂停）
    status?: Status;      // 本次标记的状态（可选，有些场景不标记）
    source: 'modal' | 'practice' | 'review';  // 来源场景
}

// 每日汇总（用于 Heatmap 和趋势图）
interface DailyStats {
    date: string;         // YYYY-MM-DD
    questionsAttempted: number;
    totalDurationMs: number;
    mastered: number;
    confused: number;
    failed: number;
}
```

### 2.2 Store 结构扩展

```
StoreState
├── times: Record<string, number>           // 保留：累计总时间（兼容）
├── timesLastModified: Record<string, number>
├── sessions: PracticeSession[]             // 新增：详细记录列表
├── dailyStats: Record<string, DailyStats>  // 新增：每日汇总（懒计算/缓存）
└── sessionsMeta: { lastCleanup: number }   // 新增：元数据
```

### 2.3 Store Actions

```typescript
// 新增动作
addSession: (session: Omit<PracticeSession, 'id'>) => void;
getSessions: (questionId?: string) => PracticeSession[];
getDailyStats: (dateRange?: [string, string]) => DailyStats[];
cleanupOldSessions: (olderThanDays: number) => void;  // 性能考虑
```

## 3. 组件/Hook 改造

### 3.1 useQuestionTimer 增强

```typescript
interface UseQuestionTimerProps {
    questionId: string | undefined;
    visibleViews: Set<string>;
    isOpen: boolean;
    source?: 'modal' | 'practice' | 'review';  // 新增：来源标记
}

// 内部：在 saveTime 时同时写入 session 记录
const saveTime = useCallback(() => {
    if (currentId && elapsedRef.current > 1000) {
        const session: Omit<PracticeSession, 'id'> = {
            questionId: currentId,
            startedAt: sessionStartRef.current,
            endedAt: Date.now(),
            durationMs: elapsedRef.current,
            source
        };
        addTime(currentId, elapsedRef.current);
        addSession(session);  // 新增
    }
}, [addTime, addSession, source]);
```

### 3.2 useLearningStats Hook (新建)

```typescript
// 统一的学习统计 Hook
function useLearningStats(options?: {
    dateRange?: [Date, Date];
    subjectFilter?: string[];
}) {
    const times = useProgressStore(s => s.times);
    const sessions = useProgressStore(s => s.sessions);
    const progress = useProgressStore(s => s.progress);
    
    return useMemo(() => {
        // 计算各种统计指标
        return {
            totalTimeMs,
            avgTimePerQuestion,
            todayStats,
            weeklyTrend,
            subjectBreakdown,
            // ...
        };
    }, [times, sessions, progress, options]);
}
```

### 3.3 Dashboard 增强

- 添加"总学习时长"卡片
- 添加"今日学习"统计
- 添加"本周趋势"图表（可选）

## 4. 迁移策略

1. **向后兼容**: 保留现有的 `times` 字段，新系统与其并行
2. **渐进增强**: 先只记录 sessions，UI 展示稍后添加
3. **数据清理**: 超过 90 天的 sessions 可选择性清理以控制存储大小

## 5. 实施步骤

1. [ ] 扩展类型定义 (types.ts)
2. [ ] 创建 createAnalyticsSlice (新 Slice)
3. [ ] 增强 useQuestionTimer
4. [ ] 创建 useLearningStats Hook
5. [ ] 更新 useDashboardStats
6. [ ] 添加 Dashboard UI 展示
7. [ ] 统一 Practice 页面计时逻辑

## 6. 性能考虑

- Sessions 数组可能增长很大，需要分页或清理策略
- DailyStats 作为缓存层，避免每次重新计算
- 使用 Zustand 的 selector 精确订阅，避免无关重渲染
