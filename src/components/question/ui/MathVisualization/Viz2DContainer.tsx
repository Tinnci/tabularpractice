"use client";

/**
 * 2D Visualization Container System
 * 
 * A standardized, extensible container for all 2D math visualizations.
 * Supports:
 * - Pan & Zoom controls
 * - Multiple layout modes (full, split, pip)
 * - Theme-aware backgrounds
 * - Responsive sizing
 */

import React, { useState, useCallback, useMemo, createContext, useContext, ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import { Viz2DControls, Viz2DInfoHint } from "./Viz2DControls";

// ============== Types ==============

export type LayoutMode = "full" | "split-horizontal" | "split-vertical" | "pip";
export type ViewMode = "global" | "local";

export interface ViewBounds {
    x: [number, number];
    y: [number, number];
}

export interface Viz2DContextValue {
    /** Current view bounds */
    viewBounds: ViewBounds;
    /** Original (full) view bounds */
    originalBounds: ViewBounds;
    /** Set custom view bounds */
    setViewBounds: (bounds: ViewBounds) => void;
    /** Reset to original bounds */
    resetView: () => void;
    /** Zoom in by factor */
    zoomIn: () => void;
    /** Zoom out by factor */
    zoomOut: () => void;
    /** Current zoom level (1 = 100%) */
    zoomLevel: number;
    /** Pan the view */
    pan: (dx: number, dy: number) => void;
    /** Current layout mode */
    layoutMode: LayoutMode;
    /** Current view mode */
    viewMode: ViewMode;
    /** Set view mode */
    setViewMode: (mode: ViewMode) => void;
    /** Local zoom region (for PIP or split view) */
    localBounds: ViewBounds | null;
    /** Set local zoom region */
    setLocalBounds: (bounds: ViewBounds | null) => void;
    /** Whether controls are visible */
    showControls: boolean;
    /** Theme mode for visualization */
    theme: "light" | "dark" | "auto";
}

const Viz2DContext = createContext<Viz2DContextValue | null>(null);

export function useViz2D() {
    const context = useContext(Viz2DContext);
    if (!context) {
        throw new Error("useViz2D must be used within a Viz2DContainer");
    }
    return context;
}

// ============== Container Props ==============

export interface Viz2DContainerProps {
    /** Child visualization components */
    children: ReactNode;
    /** Initial view bounds */
    initialBounds: ViewBounds;
    /** Height in pixels */
    height?: number;
    /** Layout mode */
    layoutMode?: LayoutMode;
    /** Show control panel */
    showControls?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Title for the visualization */
    title?: string;
    /** Theme override */
    theme?: "light" | "dark" | "auto";
    /** Local region for PIP/split view */
    localRegion?: ViewBounds;
    /** Secondary content for split/pip modes */
    secondaryContent?: ReactNode;
    /** Callback when view bounds change */
    onViewChange?: (bounds: ViewBounds) => void;
}

// ============== Main Container Component ==============

export function Viz2DContainer({
    children,
    initialBounds,
    height = 300,
    layoutMode = "full",
    showControls = true,
    className,
    title,
    theme = "auto",
    localRegion,
    secondaryContent,
    onViewChange,
}: Viz2DContainerProps) {
    // State
    const [viewBounds, setViewBoundsState] = useState<ViewBounds>(initialBounds);
    const [localBounds, setLocalBounds] = useState<ViewBounds | null>(localRegion || null);
    const [viewMode, setViewMode] = useState<ViewMode>("global");
    const [zoomLevel, setZoomLevel] = useState(1);

    // Calculate zoom
    const calculateZoom = useCallback((current: ViewBounds, original: ViewBounds) => {
        const originalWidth = original.x[1] - original.x[0];
        const currentWidth = current.x[1] - current.x[0];
        return originalWidth / currentWidth;
    }, []);

    // Handlers
    const setViewBounds = useCallback((bounds: ViewBounds) => {
        setViewBoundsState(bounds);
        setZoomLevel(calculateZoom(bounds, initialBounds));
        onViewChange?.(bounds);
    }, [initialBounds, calculateZoom, onViewChange]);

    const resetView = useCallback(() => {
        setViewBoundsState(initialBounds);
        setZoomLevel(1);
        onViewChange?.(initialBounds);
    }, [initialBounds, onViewChange]);

    const zoomIn = useCallback(() => {
        const factor = 0.8; // Zoom in = reduce view range
        setViewBoundsState(prev => {
            const centerX = (prev.x[0] + prev.x[1]) / 2;
            const centerY = (prev.y[0] + prev.y[1]) / 2;
            const halfWidthX = (prev.x[1] - prev.x[0]) / 2 * factor;
            const halfWidthY = (prev.y[1] - prev.y[0]) / 2 * factor;
            const newBounds = {
                x: [centerX - halfWidthX, centerX + halfWidthX] as [number, number],
                y: [centerY - halfWidthY, centerY + halfWidthY] as [number, number],
            };
            setZoomLevel(calculateZoom(newBounds, initialBounds));
            onViewChange?.(newBounds);
            return newBounds;
        });
    }, [initialBounds, calculateZoom, onViewChange]);

    const zoomOut = useCallback(() => {
        const factor = 1.25; // Zoom out = increase view range
        setViewBoundsState(prev => {
            const centerX = (prev.x[0] + prev.x[1]) / 2;
            const centerY = (prev.y[0] + prev.y[1]) / 2;
            const halfWidthX = (prev.x[1] - prev.x[0]) / 2 * factor;
            const halfWidthY = (prev.y[1] - prev.y[0]) / 2 * factor;
            const newBounds = {
                x: [centerX - halfWidthX, centerX + halfWidthX] as [number, number],
                y: [centerY - halfWidthY, centerY + halfWidthY] as [number, number],
            };
            setZoomLevel(calculateZoom(newBounds, initialBounds));
            onViewChange?.(newBounds);
            return newBounds;
        });
    }, [initialBounds, calculateZoom, onViewChange]);

    const pan = useCallback((dx: number, dy: number) => {
        setViewBoundsState(prev => {
            const newBounds = {
                x: [prev.x[0] + dx, prev.x[1] + dx] as [number, number],
                y: [prev.y[0] + dy, prev.y[1] + dy] as [number, number],
            };
            onViewChange?.(newBounds);
            return newBounds;
        });
    }, [onViewChange]);

    // Context value
    const contextValue = useMemo<Viz2DContextValue>(() => ({
        viewBounds,
        originalBounds: initialBounds,
        setViewBounds,
        resetView,
        zoomIn,
        zoomOut,
        zoomLevel,
        pan,
        layoutMode,
        viewMode,
        setViewMode,
        localBounds,
        setLocalBounds,
        showControls,
        theme,
    }), [viewBounds, initialBounds, setViewBounds, resetView, zoomIn, zoomOut, zoomLevel, pan, layoutMode, viewMode, localBounds, showControls, theme]);

    // Render based on layout mode
    const renderContent = () => {
        switch (layoutMode) {
            case "split-horizontal":
                return (
                    <div className="flex gap-2 h-full transition-all duration-300 ease-in-out">
                        <div className="flex-1 min-w-0 transition-all duration-300">{children}</div>
                        <div className="flex-1 min-w-0 transition-all duration-300">{secondaryContent}</div>
                    </div>
                );
            case "split-vertical":
                return (
                    <div className="flex flex-col gap-2 h-full transition-all duration-300 ease-in-out">
                        <div className="flex-1 min-h-0 transition-all duration-300">{children}</div>
                        <div className="flex-1 min-h-0 transition-all duration-300">{secondaryContent}</div>
                    </div>
                );
            case "pip":
                return (
                    <div className="relative h-full transition-all duration-300 ease-in-out">
                        <div className="w-full h-full transition-all duration-300">{children}</div>
                        {secondaryContent && (
                            <div className="absolute bottom-3 right-3 w-1/3 h-1/3 rounded-lg border-2 border-primary/50 shadow-lg overflow-hidden bg-background/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl z-10">
                                {secondaryContent}
                            </div>
                        )}
                    </div>
                );
            default:
                return <div className="w-full h-full transition-all duration-300">{children}</div>;
        }
    };

    return (
        <Viz2DContext.Provider value={contextValue}>
            <div
                className={cn(
                    "viz-2d-container relative rounded-lg overflow-hidden border",
                    "bg-slate-50 dark:bg-slate-900/50",
                    className
                )}
                style={{ height }}
            >
                {/* Title */}
                {title && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded border">
                        {title}
                    </div>
                )}

                {/* Controls */}
                {showControls ? (
                    <Viz2DControls
                        onReset={resetView}
                        onZoomIn={zoomIn}
                        onZoomOut={zoomOut}
                        zoomLevel={zoomLevel}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        hasLocalRegion={!!localBounds}
                    />
                ) : (
                    <Viz2DInfoHint />
                )}

                {/* Main Content */}
                <div className="h-full viz-2d-content">
                    {renderContent()}
                </div>
            </div>
        </Viz2DContext.Provider>
    );
}

// ============== Utility Components ==============

/**
 * A wrapper to use Mafs with proper theme-aware background
 */
export function MafsWrapper({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn(
            "mafs-theme-wrapper w-full h-full",
            "[&_.MafsView]:!bg-transparent",
            "[&_.mafs-movable-line]:cursor-move",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * Local zoom region selector - allows user to drag-select a region to zoom into
 */
export interface LocalZoomRegionProps {
    /** Callback when user selects a region */
    onRegionSelect: (bounds: ViewBounds) => void;
    /** Current view bounds (for coordinate conversion) */
    currentBounds: ViewBounds;
    /** Additional CSS classes */
    className?: string;
    /** Whether selection mode is active */
    isActive?: boolean;
    /** Cancel selection */
    onCancel?: () => void;
}

export function LocalZoomSelector({
    onRegionSelect,
    currentBounds,
    className,
    isActive = true,
    onCancel,
}: LocalZoomRegionProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert screen coordinates to math coordinates
    const screenToMath = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };

        const relX = (screenX - rect.left) / rect.width;
        const relY = (screenY - rect.top) / rect.height;

        const mathX = currentBounds.x[0] + relX * (currentBounds.x[1] - currentBounds.x[0]);
        // Y is inverted in screen coordinates
        const mathY = currentBounds.y[1] - relY * (currentBounds.y[1] - currentBounds.y[0]);

        return { x: mathX, y: mathY };
    }, [currentBounds]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isActive) return;
        e.preventDefault();
        setIsDragging(true);
        setStartPoint({ x: e.clientX, y: e.clientY });
        setEndPoint({ x: e.clientX, y: e.clientY });
    }, [isActive]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setEndPoint({ x: e.clientX, y: e.clientY });
    }, [isDragging]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !startPoint) {
            setIsDragging(false);
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
            setIsDragging(false);
            return;
        }

        const start = screenToMath(startPoint.x, startPoint.y);
        const end = screenToMath(e.clientX, e.clientY);

        // Minimum selection size (in pixels)
        const minSize = 20;
        if (Math.abs(e.clientX - startPoint.x) < minSize || Math.abs(e.clientY - startPoint.y) < minSize) {
            setIsDragging(false);
            setStartPoint(null);
            setEndPoint(null);
            return;
        }

        const newBounds: ViewBounds = {
            x: [Math.min(start.x, end.x), Math.max(start.x, end.x)],
            y: [Math.min(start.y, end.y), Math.max(start.y, end.y)],
        };

        onRegionSelect(newBounds);
        setIsDragging(false);
        setStartPoint(null);
        setEndPoint(null);
    }, [isDragging, startPoint, screenToMath, onRegionSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsDragging(false);
            setStartPoint(null);
            setEndPoint(null);
            onCancel?.();
        }
    }, [onCancel]);

    if (!isActive) return null;

    // Calculate selection box in screen coordinates
    const selectionBox = startPoint && endPoint ? {
        left: Math.min(startPoint.x, endPoint.x),
        top: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
    } : null;

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute inset-0 cursor-crosshair z-20",
                "bg-primary/5",
                className
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                if (isDragging) {
                    setIsDragging(false);
                    setStartPoint(null);
                    setEndPoint(null);
                }
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            title="拖拽选择放大区域，按 ESC 取消"
        >
            {/* Selection rectangle */}
            {isDragging && selectionBox && selectionBox.width > 5 && selectionBox.height > 5 && (
                <div
                    className="fixed border-2 border-primary bg-primary/20 pointer-events-none rounded"
                    style={{
                        left: selectionBox.left,
                        top: selectionBox.top,
                        width: selectionBox.width,
                        height: selectionBox.height,
                    }}
                />
            )}

            {/* Instructions */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-lg backdrop-blur-sm pointer-events-none">
                拖拽选择放大区域
            </div>
        </div>
    );
}

