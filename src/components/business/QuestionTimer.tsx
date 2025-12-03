import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface QuestionTimerProps {
    formattedTime: string;
    isRunning: boolean;
    toggle: () => void;
    reset: () => void;
    className?: string;
}

export function QuestionTimer({ formattedTime, isRunning, toggle, reset, className }: QuestionTimerProps) {
    return (
        <div className={cn(
            "flex items-center gap-1.5 p-1 pr-3 rounded-full border transition-all duration-300",
            isRunning
                ? "bg-blue-50/50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                : "bg-amber-50/50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
            className
        )}>
            {/* 控制按钮区域 */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-full shrink-0 transition-all",
                                isRunning ? "hover:bg-blue-200/50" : "hover:bg-amber-200/50"
                            )}
                            onClick={toggle}
                        >
                            {isRunning ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{isRunning ? "暂停计时 (Space)" : "继续计时 (Space)"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* 时间显示区域 */}
            <div className="flex items-center gap-2 select-none">
                <span className={cn(
                    "font-mono text-sm font-medium tabular-nums min-w-[3rem] text-center",
                    !isRunning && "opacity-80"
                )}>
                    {formattedTime}
                </span>

                {/* 状态指示点 (类似录像红点) */}
                <span className="relative flex h-2 w-2">
                    {isRunning && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    )}
                    <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isRunning ? "bg-current" : "bg-gray-300 dark:bg-gray-600"
                    )}></span>
                </span>
            </div>

            {/* 重置按钮 (仅在暂停且有时间时显示，避免误触) */}
            {!isRunning && formattedTime !== "00:00" && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 text-muted-foreground hover:text-foreground rounded-full"
                    onClick={() => reset()}
                    title="重新计时"
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
