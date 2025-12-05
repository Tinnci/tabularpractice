import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DICT } from "@/lib/i18n";

interface Props {
    formattedTime: string;
    isRunning: boolean;
    toggle: () => void;
    reset: () => void;
    className?: string; // Added className prop for compatibility
}

export function QuestionTimer({ formattedTime, isRunning, toggle, reset, className }: Props) {
    return (
        <div className={cn(
            "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-500",
            // 运行时：蓝色高亮，呼吸灯效果
            isRunning
                ? "bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 shadow-sm shadow-blue-500/10"
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
                        <p className="text-xs">{isRunning ? `${DICT.common.pause} (Space)` : `${DICT.common.start} (Space)`}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <span className="font-mono text-sm font-medium tabular-nums min-w-[40px] text-center select-none">
                {formattedTime}
            </span>

            {/* 状态指示灯 */}
            <div className="relative flex h-2 w-2 mx-1">
                {isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 duration-1000"></span>
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
                    isRunning ? "bg-blue-500 shadow-[0_0_8px_hsl(var(--blue-500))]" : "bg-slate-300 dark:bg-slate-600"
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
