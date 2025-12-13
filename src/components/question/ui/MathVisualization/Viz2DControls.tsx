"use client";

/**
 * 2D Visualization Controls
 * 
 * Standardized control panel for all 2D math visualizations.
 * Matches the style of Viz3DControls for consistency.
 */

import { Home, ZoomIn, ZoomOut, Info, Maximize2, Minimize2, Grid3X3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ViewMode } from "./Viz2DContainer";

// ============== Control Button ==============

interface ControlButtonProps {
    onClick?: () => void;
    icon: React.ReactNode;
    tooltip: string;
    active?: boolean;
    disabled?: boolean;
}

function ControlButton({ onClick, icon, tooltip, active, disabled }: ControlButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
                        "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                        active && "bg-primary/10 border-primary/50"
                    )}
                >
                    {icon}
                </button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p className="text-xs">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

// ============== Main Controls Component ==============

export interface Viz2DControlsProps {
    onReset?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    zoomLevel?: number;
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    hasLocalRegion?: boolean;
    onToggleLocalZoom?: () => void;
    className?: string;
}

export function Viz2DControls({
    onReset,
    onZoomIn,
    onZoomOut,
    zoomLevel = 1,
    viewMode = "global",
    onViewModeChange,
    hasLocalRegion,
    onToggleLocalZoom,
    className,
}: Viz2DControlsProps) {
    const iconClass = "w-3.5 h-3.5";

    return (
        <div className={cn("absolute top-2 right-2 flex flex-col gap-1 z-10", className)}>
            {/* Info */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm cursor-help">
                        <Info className={cn(iconClass, "text-muted-foreground")} />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <div className="text-xs space-y-1">
                        <p>🖱️ 拖拽平移</p>
                        <p>⚙️ 滚轮缩放</p>
                        <p>🔍 双击聚焦</p>
                    </div>
                </TooltipContent>
            </Tooltip>

            {/* Reset */}
            {onReset && (
                <ControlButton
                    onClick={onReset}
                    icon={<Home className={iconClass} />}
                    tooltip="重置视图"
                />
            )}

            {/* Zoom In */}
            {onZoomIn && (
                <ControlButton
                    onClick={onZoomIn}
                    icon={<ZoomIn className={iconClass} />}
                    tooltip={`放大 (${Math.round(zoomLevel * 100)}%)`}
                />
            )}

            {/* Zoom Out */}
            {onZoomOut && (
                <ControlButton
                    onClick={onZoomOut}
                    icon={<ZoomOut className={iconClass} />}
                    tooltip="缩小"
                />
            )}

            {/* View Mode Toggle */}
            {onViewModeChange && hasLocalRegion && (
                <>
                    <div className="h-px bg-border/50 my-1" />
                    <ControlButton
                        onClick={() => onViewModeChange(viewMode === "global" ? "local" : "global")}
                        icon={viewMode === "global"
                            ? <Maximize2 className={iconClass} />
                            : <Minimize2 className={iconClass} />
                        }
                        tooltip={viewMode === "global" ? "切换到局部视图" : "切换到全局视图"}
                        active={viewMode === "local"}
                    />
                </>
            )}

            {/* Local Zoom Toggle */}
            {onToggleLocalZoom && (
                <ControlButton
                    onClick={onToggleLocalZoom}
                    icon={<Grid3X3 className={iconClass} />}
                    tooltip="选择局部放大区域"
                />
            )}
        </div>
    );
}

// ============== Simple Info Hint ==============

export function Viz2DInfoHint({ className }: { className?: string }) {
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
                        <p>🖱️ 拖拽平移</p>
                        <p>⚙️ 滚轮缩放</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

// ============== Zoom Level Indicator ==============

export function ZoomIndicator({
    level,
    className
}: {
    level: number;
    className?: string;
}) {
    if (Math.abs(level - 1) < 0.01) return null;

    return (
        <div className={cn(
            "absolute bottom-2 right-2 px-2 py-1 text-xs rounded",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "text-muted-foreground font-mono",
            className
        )}>
            {Math.round(level * 100)}%
        </div>
    );
}

// ============== Layout Mode Selector ==============

export interface LayoutModeSelectorProps {
    currentMode: "full" | "split-horizontal" | "split-vertical" | "pip";
    onChange: (mode: "full" | "split-horizontal" | "split-vertical" | "pip") => void;
    className?: string;
}

export function LayoutModeSelector({ currentMode, onChange, className }: LayoutModeSelectorProps) {
    const modes = [
        { id: "full" as const, icon: <Maximize2 className="w-3 h-3" />, label: "全屏" },
        { id: "split-horizontal" as const, icon: <Grid3X3 className="w-3 h-3" />, label: "左右分屏" },
        { id: "split-vertical" as const, icon: <Layers className="w-3 h-3" />, label: "上下分屏" },
        { id: "pip" as const, icon: <Minimize2 className="w-3 h-3" />, label: "画中画" },
    ];

    return (
        <div className={cn("flex gap-1 p-1 bg-background/80 backdrop-blur-sm rounded-lg border", className)}>
            {modes.map(mode => (
                <Tooltip key={mode.id}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onChange(mode.id)}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                currentMode === mode.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                            )}
                        >
                            {mode.icon}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{mode.label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
