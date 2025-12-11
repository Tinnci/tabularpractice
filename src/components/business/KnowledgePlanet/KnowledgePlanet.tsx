import React, { useRef, useState, useEffect, useMemo } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { useForceLayout } from './useForceLayout';
import { PlanetNode } from './PlanetNode';
import { Legend } from './Legend';
import { cn } from '@/lib/utils';
import { ConnectionLines } from './ConnectionLines';

interface KnowledgePlanetProps {
    tags: EnhancedTagNode[];
    selectedTagIds: Set<string>;
    onTagToggle: (id: string) => void;
    className?: string;
    autoRotate?: boolean;
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

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden w-full h-full min-h-[400px] isolate bg-slate-50/50 dark:bg-slate-900/20 rounded-xl", className)}
            onMouseLeave={() => setInternalHoverId(null)}
        >
            {/* Center Reference for Absolute Positioning */}
            <div className="absolute top-1/2 left-1/2 w-0 h-0">
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

            <Legend />
        </div>
    );
};
