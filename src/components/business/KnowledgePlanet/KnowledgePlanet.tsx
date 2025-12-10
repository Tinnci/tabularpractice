import React, { useRef, useState, useEffect, useMemo } from 'react'; // Added useMemo to imports
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { use3DLayout } from './use3DLayout';
import { PlanetNode } from './PlanetNode';
import { Legend } from './Legend';
import { cn } from '@/lib/utils'; // Added cn import

import { ConnectionLines } from './ConnectionLines';

interface KnowledgePlanetProps {
    tags: EnhancedTagNode[];
    selectedTagIds: Set<string>;
    onTagToggle: (id: string) => void;
    width?: number;
    height?: number;
    className?: string;
    autoRotate?: boolean;
}

export const KnowledgePlanet: React.FC<KnowledgePlanetProps> = ({
    tags,
    selectedTagIds,
    onTagToggle,
    width = 600,
    height = 600,
    className,
    autoRotate = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Filter tags to display? 
    // Maybe we filter out tags with depth > 2 if too many?
    // For now use all passed tags.
    const displayTags = tags;
    const count = displayTags.length;
    // Radius should adapt to container but we use fixed layout radius for calculation
    // and scale it by CSS or view projection.
    const radius = Math.min(width, height) / 3;

    const positions = use3DLayout(count, radius);

    // Auto rotate
    useEffect(() => {
        if (!autoRotate || isDragging) return;

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
    }, [autoRotate, isDragging]);

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
    const projectedNodes = useMemo(() => { // Now useMemo is defined
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        return displayTags.map((node, i) => {
            const pos = positions[i];

            // Rotate around Y
            const x = pos.x * cosY - pos.z * sinY;
            let z = pos.z * cosY + pos.x * sinY;

            // Rotate around X
            const y = pos.y * cosX - z * sinX;
            z = z * cosX + pos.y * sinX;

            // Perspective scale
            // z ranges from -radius to +radius roughly
            // scale factor: larger when closer (z > 0)
            const scale = (z + radius * 2) / (radius * 3) + 0.5; // simple depth scale
            // Better opacity:
            const opacity = Math.max(0.2, (z + radius * 1.5) / (radius * 2.5));

            return {
                node,
                x,
                y,
                z,
                scale,
                opacity
            };
        }).sort((a, b) => a.z - b.z); // Painter's algorithm
    }, [displayTags, positions, rotation, radius]);

    // Hover state
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden cursor-grab active:cursor-grabbing", className)}
            style={{ width: '100%', height: height, touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute top-1/2 left-1/2 w-0 h-0 transform-style-3d">
                {/* Lines behind nodes */}
                <ConnectionLines nodes={projectedNodes} hoveredNodeId={hoveredNodeId} />

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
                        onClick={onTagToggle}
                        onMouseEnter={() => setHoveredNodeId(pNode.node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                    />
                ))}
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-primary/5 to-transparent opacity-50" />

            <Legend />
        </div>
    );
};
