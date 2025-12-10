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
    autoRotate = true,
    hoveredNodeId
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
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

    const displayTags = tags;
    const count = displayTags.length;
    // Dynamic radius based on current container size
    const radius = Math.min(dimensions.width, dimensions.height) / 3;

    // Use Physics Layout
    const nodeIds = useMemo(() => displayTags.map(t => t.id), [displayTags]);
    const positions = useForceLayout(count, radius, nodeIds, activeHoverId);

    // Auto rotate
    useEffect(() => {
        if (!autoRotate || isDragging || activeHoverId) return;

        let animationFrame: number;
        const animate = () => {
            setRotation(prev => ({
                x: prev.x + 0.0005, // Slow rotation
                y: prev.y + 0.001
            }));
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [autoRotate, isDragging, activeHoverId]); // Stop rotation on hover

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;

        setRotation(prev => ({
            x: prev.x - deltaY * 0.005,
            y: prev.y + deltaX * 0.005
        }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Calculate projected positions
    const projectedNodes = useMemo(() => {
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        return displayTags.map((node, i) => {
            const pos = positions[i];
            if (!pos) return null; // Safe guard

            // Rotate around Y
            const x = pos.x * cosY - pos.z * sinY;
            let z = pos.z * cosY + pos.x * sinY;

            // Rotate around X
            const y = pos.y * cosX - z * sinX;
            z = z * cosX + pos.y * sinX;

            // Perspective scale
            const scale = (z + radius * 2) / (radius * 3) + 0.5;
            const opacity = Math.max(0.2, (z + radius * 1.5) / (radius * 2.5));

            return {
                node,
                x,
                y,
                z,
                scale,
                opacity
            };
        })
            .filter((n): n is NonNullable<typeof n> => n !== null)
            .sort((a, b) => a.z - b.z);
    }, [displayTags, positions, rotation, radius]);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden cursor-grab active:cursor-grabbing w-full h-full min-h-[400px]", className)}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute top-1/2 left-1/2 w-0 h-0 transform-style-3d">
                {/* Lines behind nodes */}
                <ConnectionLines nodes={projectedNodes} hoveredNodeId={activeHoverId} />

                {projectedNodes.map((pNode) => (
                    <PlanetNode
                        key={pNode.node.id}
                        node={pNode.node}
                        x={pNode.x}
                        y={pNode.y}
                        z={pNode.z}
                        scale={pNode.scale}
                        opacity={pNode.opacity}
                        isSelected={selectedTagIds.has(pNode.node.id)}
                        isHovered={activeHoverId === pNode.node.id}
                        onClick={onTagToggle}
                        onMouseEnter={() => setInternalHoverId(pNode.node.id)}
                        onMouseLeave={() => setInternalHoverId(null)}
                    />
                ))}
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-primary/5 to-transparent opacity-50" />

            <Legend />
        </div>
    );
};
