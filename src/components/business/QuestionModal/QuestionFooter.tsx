"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { DICT } from "@/lib/i18n";
import { Status } from "@/lib/types";

export interface QuestionFooterProps {
    hasPrev: boolean;
    hasNext: boolean;
    isLoading?: boolean;
    onPrev: () => void;
    onNext: () => void;
    onStatusUpdate: (status: Status) => void;
}

export function QuestionFooter({
    hasPrev,
    hasNext,
    isLoading,
    onPrev,
    onNext,
    onStatusUpdate,
}: QuestionFooterProps) {
    return (
        <div className="p-2 sm:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-4 border-t bg-background grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
            {/* 左侧：上一题 - 移动端仅图标 */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onPrev}
                            disabled={!hasPrev || isLoading}
                            size="icon"
                            className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-1" />
                            <span className="hidden sm:inline">{DICT.common.prev}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{DICT.common.shortcutPrev}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* 中间：状态操作按钮 - 移动端紧凑布局 */}
            <div className="flex justify-center gap-2 sm:gap-3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => onStatusUpdate('mastered')}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                            >
                                <Check className="w-4 h-4" />
                                <span className="text-xs sm:text-sm">{DICT.status.mastered}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{DICT.status.shortcutMastered}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => onStatusUpdate('confused')}
                                disabled={isLoading}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span className="text-xs sm:text-sm">{DICT.status.confused}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{DICT.status.shortcutConfused}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => onStatusUpdate('failed')}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700 text-white gap-1 sm:gap-2 flex-1 sm:w-28 shadow-sm active:scale-95 h-10 sm:h-10"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs sm:text-sm">{DICT.status.failed}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{DICT.status.shortcutFailed}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* 右侧：下一题 - 移动端仅图标 */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onNext}
                            disabled={!hasNext || isLoading}
                            size="icon"
                            className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                            <span className="hidden sm:inline">{DICT.common.next}</span>
                            <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5 sm:ml-1" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{DICT.common.shortcutNext}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
