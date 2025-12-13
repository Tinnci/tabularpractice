"use client";

/**
 * Split View Comparison Component
 * 
 * A ready-to-use component for comparing two visualizations side-by-side,
 * with synchronized or independent panning/zooming options.
 */

import React, { useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LayoutModeSelector } from "./Viz2DControls";
import { Link, Unlink } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============== Types ==============

export type SplitDirection = "horizontal" | "vertical";
export type CompareMode = "synced" | "independent";

export interface ViewBounds {
    x: [number, number];
    y: [number, number];
}

export interface SplitViewCompareProps {
    /** Primary (left/top) content */
    primaryContent: ReactNode;
    /** Secondary (right/bottom) content */
    secondaryContent: ReactNode;
    /** Primary view label */
    primaryLabel?: string;
    /** Secondary view label */
    secondaryLabel?: string;
    /** Split direction */
    direction?: SplitDirection;
    /** Initial split ratio (0-1, default 0.5) */
    splitRatio?: number;
    /** Whether views are synced */
    synced?: boolean;
    /** Callback when sync state changes */
    onSyncChange?: (synced: boolean) => void;
    /** Height in pixels */
    height?: number;
    /** Additional CSS classes */
    className?: string;
    /** Show layout mode selector */
    showLayoutSelector?: boolean;
    /** Initial layout mode */
    initialLayout?: "split-horizontal" | "split-vertical" | "pip";
}

// ============== Split View Component ==============

export function SplitViewCompare({
    primaryContent,
    secondaryContent,
    primaryLabel = "全局视图",
    secondaryLabel = "局部视图",
    // direction, // Reserved for fix split direction
    // splitRatio, // Reserved for resizable split
    synced: initialSynced = false,
    onSyncChange,
    height = 400,
    className,
    showLayoutSelector = true,
    initialLayout = "split-horizontal",
}: SplitViewCompareProps) {
    const [layout, setLayout] = useState<"split-horizontal" | "split-vertical" | "pip">(initialLayout);
    const [synced, setSynced] = useState(initialSynced);

    const handleSyncToggle = useCallback(() => {
        const newSynced = !synced;
        setSynced(newSynced);
        onSyncChange?.(newSynced);
    }, [synced, onSyncChange]);

    const handleLayoutChange = useCallback((newLayout: "full" | "split-horizontal" | "split-vertical" | "pip") => {
        if (newLayout !== "full") {
            setLayout(newLayout);
        }
    }, []);

    // Render based on layout
    const renderContent = () => {
        switch (layout) {
            case "split-horizontal":
                return (
                    <div className="flex gap-2 h-full">
                        <div className="flex-1 min-w-0 relative">
                            <ViewLabel label={primaryLabel} position="top-left" />
                            {primaryContent}
                        </div>
                        <div className="w-px bg-border" />
                        <div className="flex-1 min-w-0 relative">
                            <ViewLabel label={secondaryLabel} position="top-left" />
                            {secondaryContent}
                        </div>
                    </div>
                );

            case "split-vertical":
                return (
                    <div className="flex flex-col gap-2 h-full">
                        <div className="flex-1 min-h-0 relative">
                            <ViewLabel label={primaryLabel} position="top-left" />
                            {primaryContent}
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex-1 min-h-0 relative">
                            <ViewLabel label={secondaryLabel} position="top-left" />
                            {secondaryContent}
                        </div>
                    </div>
                );

            case "pip":
                return (
                    <div className="relative h-full">
                        {primaryContent}
                        <div className="absolute bottom-3 right-3 w-2/5 h-2/5 rounded-lg border-2 border-primary/50 shadow-xl overflow-hidden bg-background/95 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl">
                            <ViewLabel label={secondaryLabel} position="top-left" size="sm" />
                            {secondaryContent}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden border bg-background",
                className
            )}
            style={{ height }}
        >
            {/* Control Bar */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                {/* Sync Toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleSyncToggle}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                "bg-background/80 backdrop-blur-sm border shadow-sm",
                                synced
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/50 hover:bg-muted"
                            )}
                        >
                            {synced ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p className="text-xs">{synced ? "取消同步" : "同步视图"}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Layout Selector */}
                {showLayoutSelector && (
                    <LayoutModeSelector
                        currentMode={layout}
                        onChange={handleLayoutChange}
                    />
                )}
            </div>

            {/* Main Content */}
            <div className="h-full">
                {renderContent()}
            </div>
        </div>
    );
}

// ============== Helper Components ==============

interface ViewLabelProps {
    label: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size?: "sm" | "md";
}

function ViewLabel({ label, position = "top-left", size = "md" }: ViewLabelProps) {
    const positionClasses = {
        "top-left": "top-2 left-2",
        "top-right": "top-2 right-2",
        "bottom-left": "bottom-2 left-2",
        "bottom-right": "bottom-2 right-2",
    };

    const sizeClasses = {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
    };

    return (
        <div className={cn(
            "absolute z-10 font-medium bg-background/80 backdrop-blur-sm rounded border",
            positionClasses[position],
            sizeClasses[size]
        )}>
            {label}
        </div>
    );
}

// ============== Picture-in-Picture Component ==============

export interface PictureInPictureProps {
    /** Main (background) content */
    mainContent: ReactNode;
    /** PIP (overlay) content */
    pipContent: ReactNode;
    /** PIP label */
    pipLabel?: string;
    /** PIP position */
    pipPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** PIP size as fraction of main (0.2-0.5) */
    pipSize?: number;
    /** Height in pixels */
    height?: number;
    /** Additional CSS classes */
    className?: string;
    /** Can PIP be closed */
    closable?: boolean;
    /** Callback when PIP is closed */
    onClose?: () => void;
    /** Can PIP be expanded to full */
    expandable?: boolean;
    /** Callback when PIP is expanded */
    onExpand?: () => void;
}

export function PictureInPicture({
    mainContent,
    pipContent,
    pipLabel = "局部放大",
    pipPosition = "bottom-right",
    pipSize = 0.35,
    height = 400,
    className,
    closable = true,
    onClose,
    expandable = true,
    onExpand,
}: PictureInPictureProps) {
    const [isHovered, setIsHovered] = useState(false);

    const positionClasses = {
        "top-left": "top-3 left-3",
        "top-right": "top-3 right-3",
        "bottom-left": "bottom-3 left-3",
        "bottom-right": "bottom-3 right-3",
    };

    const pipSizePercent = Math.min(0.5, Math.max(0.2, pipSize)) * 100;

    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden border bg-background",
                className
            )}
            style={{ height }}
        >
            {/* Main Content */}
            {mainContent}

            {/* PIP Overlay */}
            <div
                className={cn(
                    "absolute rounded-lg border-2 shadow-xl overflow-hidden",
                    "bg-background/95 backdrop-blur-sm",
                    "transition-all duration-300 ease-out",
                    isHovered ? "scale-105 shadow-2xl border-primary" : "border-primary/50",
                    positionClasses[pipPosition]
                )}
                style={{
                    width: `${pipSizePercent}%`,
                    height: `${pipSizePercent}%`,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* PIP Label */}
                <ViewLabel label={pipLabel} position="top-left" size="sm" />

                {/* PIP Controls */}
                {(closable || expandable) && isHovered && (
                    <div className="absolute top-1 right-1 z-20 flex gap-1">
                        {expandable && (
                            <button
                                onClick={onExpand}
                                className="p-1 rounded bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-colors"
                                title="展开"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
                        )}
                        {closable && (
                            <button
                                onClick={onClose}
                                className="p-1 rounded bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-destructive/10 transition-colors"
                                title="关闭"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* PIP Content */}
                <div className="w-full h-full">
                    {pipContent}
                </div>
            </div>
        </div>
    );
}
