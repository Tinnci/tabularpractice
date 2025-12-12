"use client";

import { useState, useCallback } from "react";
import { Play, Pause, RotateCcw, History, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DICT } from "@/lib/i18n";

interface Props {
    formattedTime: string;
    isRunning: boolean;
    toggle: () => void;
    reset: () => void;
    className?: string;
    // 增强属性
    hasHistory?: boolean;
    formattedTotalTime?: string;
    formattedHistoricalTime?: string;
    historicalTimeMs?: number;  // 新增：用于编辑
    questionId?: string;        // 新增：用于保存
    onSetTime?: (totalMs: number) => void;  // 新增：设置时间回调
}

export function QuestionTimer({
    formattedTime,
    isRunning,
    toggle,
    reset,
    className,
    hasHistory = false,
    formattedTotalTime,
    formattedHistoricalTime,
    historicalTimeMs = 0,
    onSetTime,
}: Props) {
    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editMinutes, setEditMinutes] = useState("");
    const [editSeconds, setEditSeconds] = useState("");

    // 优先显示：有历史记录时显示累计时间，否则显示本次时间
    const displayTime = hasHistory && formattedTotalTime ? formattedTotalTime : formattedTime;

    // 打开编辑器时初始化值
    const handleOpenEdit = useCallback(() => {
        const totalSeconds = Math.floor(historicalTimeMs / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        setEditMinutes(mins.toString());
        setEditSeconds(secs.toString().padStart(2, '0'));
        setIsEditing(true);
    }, [historicalTimeMs]);

    // 保存编辑
    const handleSaveEdit = useCallback(() => {
        const mins = parseInt(editMinutes) || 0;
        const secs = parseInt(editSeconds) || 0;
        const totalMs = (mins * 60 + secs) * 1000;

        if (onSetTime) {
            onSetTime(totalMs);
        }
        setIsEditing(false);
    }, [editMinutes, editSeconds, onSetTime]);

    // 快捷调整
    const handleQuickAdjust = useCallback((deltaMinutes: number) => {
        const currentMs = historicalTimeMs;
        const newMs = Math.max(0, currentMs + deltaMinutes * 60 * 1000);
        if (onSetTime) {
            onSetTime(newMs);
        }
        setIsEditing(false);
    }, [historicalTimeMs, onSetTime]);

    return (
        <div className={cn(
            "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-500",
            // 运行时：蓝色高亮，呼吸灯效果
            isRunning
                ? "bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 shadow-sm shadow-blue-500/10"
                : hasHistory
                    ? "bg-amber-50/50 border-amber-200/50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-400"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
            className
        )}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-background/50"
                            onClick={toggle}
                        >
                            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p className="text-xs">
                            {isRunning ? `${DICT.common.pause} (Space)` : `${DICT.common.start} (Space)`}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* 时间显示 - 可编辑 */}
            <Popover open={isEditing} onOpenChange={setIsEditing}>
                <TooltipProvider>
                    <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleOpenEdit}
                                    className={cn(
                                        "font-mono text-sm font-medium tabular-nums min-w-[40px] text-center select-none cursor-pointer",
                                        "hover:bg-background/50 rounded px-1 py-0.5 transition-colors",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                        hasHistory && "flex items-center gap-1"
                                    )}
                                >
                                    {hasHistory && <History className="h-3 w-3 opacity-60" />}
                                    {displayTime}
                                </button>
                            </TooltipTrigger>
                        </PopoverTrigger>

                        {/* Tooltip 内容 */}
                        {hasHistory && formattedHistoricalTime && !isEditing && (
                            <TooltipContent side="bottom" className="bg-popover text-popover-foreground border shadow-md">
                                <div className="text-xs space-y-1">
                                    <p>{DICT.time.totalTime}: {formattedHistoricalTime}</p>
                                    <p>{DICT.time.currentTime}: {formattedTime}</p>
                                    <p className="text-muted-foreground pt-1 border-t">{DICT.time.clickToEdit}</p>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                {/* 编辑 Popover */}
                <PopoverContent
                    side="bottom"
                    align="center"
                    className="w-auto p-3 bg-popover border shadow-lg"
                >
                    <div className="space-y-3">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Edit2 className="h-3 w-3" />
                            {DICT.time.editTotalTime}
                        </div>

                        {/* 时间输入 */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min="0"
                                    max="999"
                                    value={editMinutes}
                                    onChange={(e) => setEditMinutes(e.target.value)}
                                    className="w-14 h-8 text-center font-mono text-sm"
                                    placeholder="00"
                                />
                                <span className="text-xs text-muted-foreground">{DICT.time.minute}</span>
                            </div>
                            <span className="text-lg font-bold text-muted-foreground">:</span>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={editSeconds}
                                    onChange={(e) => setEditSeconds(e.target.value)}
                                    className="w-14 h-8 text-center font-mono text-sm"
                                    placeholder="00"
                                />
                                <span className="text-xs text-muted-foreground">{DICT.time.second}</span>
                            </div>
                        </div>

                        {/* 快捷按钮 */}
                        <div className="flex items-center gap-1 pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => handleQuickAdjust(-5)}
                            >
                                -5{DICT.time.minuteShort}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => handleQuickAdjust(-1)}
                            >
                                -1{DICT.time.minuteShort}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => handleQuickAdjust(1)}
                            >
                                +1{DICT.time.minuteShort}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => handleQuickAdjust(5)}
                            >
                                +5{DICT.time.minuteShort}
                            </Button>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 flex-1 text-xs"
                                onClick={() => setIsEditing(false)}
                            >
                                {DICT.common.cancel}
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                                onClick={handleSaveEdit}
                            >
                                {DICT.common.save}
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* 状态指示灯 */}
            <div className="relative flex h-2 w-2 mx-1">
                {isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 duration-1000"></span>
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
                    isRunning
                        ? "bg-blue-500 shadow-[0_0_8px_hsl(var(--blue-500))]"
                        : hasHistory
                            ? "bg-amber-400 dark:bg-amber-500"
                            : "bg-slate-300 dark:bg-slate-600"
                )}></span>
            </div>

            {/* 仅在暂停且有时间时显示重置，防止误触 */}
            {!isRunning && formattedTime !== "00:00" && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => reset()}
                    title={DICT.common.resetTime}
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
