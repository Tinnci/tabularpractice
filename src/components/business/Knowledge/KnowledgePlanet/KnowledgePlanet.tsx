import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { useForceLayout } from './useForceLayout';
import { PlanetNode } from './PlanetNode';
import { Legend } from './Legend';
import { cn } from '@/lib/utils';
import { ConnectionLines } from './ConnectionLines';
import { Home, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { DICT } from '@/lib/i18n';

export interface KnowledgePlanetProps {
    tags: EnhancedTagNode[];
    selectedTagIds: Set<string>;
    onTagToggle: (id: string) => void;
    className?: string;
    hoveredNodeId?: string | null;
}

export const KnowledgePlanet: React.FC<KnowledgePlanetProps> = ({
    tags,
    selectedTagIds,
    onTagToggle,
    className,
    hoveredNodeId
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
    const [internalHoverId, setInternalHoverId] = useState<string | null>(null);

    // Pan and Zoom state
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Combine external and internal hover
    const activeHoverId = hoveredNodeId || internalHoverId;

    // Resize Observer to make it truly responsive
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const count = tags.length;
    // Dynamic radius based on current container size
    // Use smaller dimension to ensure fit, with a minimum to prevent 0
    const radius = Math.max(80, Math.min(dimensions.width, dimensions.height) / 2.5);

    // Use Physics Layout
    const nodeIds = useMemo(() => tags.map(t => t.id), [tags]);
    const positions = useForceLayout(count, radius, nodeIds, activeHoverId);

    // Prepare data for rendering
    const nodesToRender = useMemo(() => {
        return tags.map((node, i) => {
            const pos = positions[i];
            if (!pos) return null;
            return {
                node,
                x: pos.x,
                y: pos.y
            };
        }).filter((n): n is NonNullable<typeof n> => n !== null);
    }, [tags, positions]);

    // Mouse handlers for panning
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only pan on left click and not on a node
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('[data-planet-node]')) return;

        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(3, Math.max(0.3, prev * delta)));
    }, []);

    // Control functions
    const resetView = useCallback(() => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
    }, []);

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(3, prev * 1.2));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(0.3, prev / 1.2));
    }, []);

    const fitToView = useCallback(() => {
        // Calculate bounds of all nodes
        if (nodesToRender.length === 0) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodesToRender.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });

        const contentWidth = maxX - minX + 100; // Add padding
        const contentHeight = maxY - minY + 100;

        const scaleX = dimensions.width / contentWidth;
        const scaleY = dimensions.height / contentHeight;
        const newZoom = Math.min(2, Math.max(0.5, Math.min(scaleX, scaleY)));

        setZoom(newZoom);
        setPan({ x: 0, y: 0 });
    }, [nodesToRender, dimensions]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden w-full h-full min-h-[400px] isolate bg-slate-50/50 dark:bg-slate-900/20 rounded-xl",
                isDragging ? "cursor-grabbing" : "cursor-grab",
                className
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                setInternalHoverId(null);
                setIsDragging(false);
            }}
            onWheel={handleWheel}
        >
            {/* Transformed container for pan and zoom */}
            <div
                className="absolute top-1/2 left-1/2 w-0 h-0 transition-transform duration-100"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
            >
                {/* Background Lines */}
                <ConnectionLines nodes={nodesToRender} hoveredNodeId={activeHoverId} />

                {/* Nodes */}
                {nodesToRender.map((pNode) => (
                    <PlanetNode
                        key={pNode.node.id}
                        node={pNode.node}
                        x={pNode.x}
                        y={pNode.y}
                        isSelected={selectedTagIds.has(pNode.node.id)}
                        isHovered={activeHoverId === pNode.node.id}
                        onClick={onTagToggle}
                        onMouseEnter={() => setInternalHoverId(pNode.node.id)}
                        onMouseLeave={() => setInternalHoverId(null)}
                    />
                ))}
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-primary/5 to-transparent opacity-30" />

            {/* Control Panel */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-50">
                <button
                    onClick={resetView}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted transition-colors"
                    title={DICT.planet.reset}
                >
                    <Home className="w-4 h-4" />
                </button>
                <button
                    onClick={zoomIn}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted transition-colors"
                    title={DICT.planet.zoomIn}
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button
                    onClick={zoomOut}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted transition-colors"
                    title={DICT.planet.zoomOut}
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button
                    onClick={fitToView}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted transition-colors"
                    title={DICT.planet.fitToView}
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            {/* Zoom indicator */}
            {zoom !== 1 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
                    {Math.round(zoom * 100)}%
                </div>
            )}

            <Legend />
        </div>
    );
};
