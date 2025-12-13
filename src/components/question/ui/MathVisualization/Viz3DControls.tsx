"use client";

import { Home, ZoomIn, ZoomOut, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Viz3DControlsProps {
    onReset?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    className?: string;
    showInfo?: boolean;
}

/**
 * Control panel for 3D visualizations.
 * Provides reset, zoom in/out buttons in a consistent style.
 */
export function Viz3DControls({
    onReset,
    onZoomIn,
    onZoomOut,
    className,
    showInfo = true,
}: Viz3DControlsProps) {
    const buttonClass = "p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted transition-colors";

    return (
        <div className={cn("absolute top-2 right-2 flex flex-col gap-1 z-10", className)}>
            {showInfo && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(buttonClass, "cursor-help")}>
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="text-xs">拖拽旋转 · 滚轮缩放</p>
                    </TooltipContent>
                </Tooltip>
            )}
            {onReset && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button onClick={onReset} className={buttonClass}>
                            <Home className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="text-xs">重置视角</p>
                    </TooltipContent>
                </Tooltip>
            )}
            {onZoomIn && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button onClick={onZoomIn} className={buttonClass}>
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="text-xs">放大</p>
                    </TooltipContent>
                </Tooltip>
            )}
            {onZoomOut && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button onClick={onZoomOut} className={buttonClass}>
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="text-xs">缩小</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

/**
 * Simple info-only control that shows drag/zoom hints.
 * Used when zoom controls are handled internally by OrbitControls.
 */
export function Viz3DInfoHint({ className }: { className?: string }) {
    return (
        <div className={cn("absolute top-2 right-2 z-10", className)}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm cursor-help">
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <div className="text-xs space-y-1">
                        <p>🖱️ 拖拽旋转</p>
                        <p>⚙️ 滚轮缩放</p>
                        <p>📌 右键平移</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
