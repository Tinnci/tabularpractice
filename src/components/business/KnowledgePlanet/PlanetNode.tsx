import React from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { cn } from '@/lib/utils';

interface PlanetNodeProps {
    node: EnhancedTagNode;
    x: number;
    y: number;
    z: number;
    isSelected: boolean;
    onClick: (id: string) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    scale?: number;
    opacity?: number;
}

export const PlanetNode: React.FC<PlanetNodeProps> = ({
    node,
    x,
    y,
    z,
    isSelected,
    onClick,
    onMouseEnter,
    onMouseLeave,
    scale = 1,
    opacity = 1
}) => {
    // Determine color/style based on priority/status
    const { priority, weaknessScore, sizeMultiplier } = node.computed;

    // Base size (e.g. 12px to 24px)
    const baseSize = 8 + (sizeMultiplier * 4);

    let colorClass = "text-muted-foreground/60"; // Default grey
    let glowClass = "";
    let animationClass = "";

    if (node.stats.total > 0) {
        if (priority === 'critical') {
            colorClass = "text-red-500 font-bold";
            glowClass = "shadow-[0_0_15px_rgba(239,68,68,0.6)]";
            animationClass = "animate-pulse";
        } else if (priority === 'high') {
            colorClass = "text-orange-500 font-semibold";
            glowClass = "shadow-[0_0_10px_rgba(249,115,22,0.5)]";
        } else if (priority === 'medium') {
            colorClass = "text-yellow-500";
            glowClass = "shadow-[0_0_5px_rgba(234,179,8,0.4)]";
        } else {
            // Low priority (Mastered or just started)
            if (node.stats.mastered > 0 && node.stats.failed === 0) {
                colorClass = "text-green-500";
                glowClass = "shadow-[0_0_5px_rgba(34,197,94,0.3)]";
            } else {
                colorClass = "text-primary/80";
            }
        }
    }

    if (isSelected) {
        colorClass = "text-primary font-bold";
        glowClass = "shadow-[0_0_20px_rgba(var(--primary),0.8)] border-primary";
    }

    // Interactive scale on hover handled by parent or CSS
    // z-index is handled by parent ordering or explicit zIndex style

    return (
        <div
            className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 select-none flex items-center justify-center rounded-full backdrop-blur-sm border border-transparent hover:z-50 hover:scale-125 hover:border-primary/50 hover:bg-background/80",
                colorClass,
                glowClass,
                animationClass
            )}
            style={{
                transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
                opacity: opacity,
                zIndex: Math.floor(z + 1000), // Ensure depth sorting
                fontSize: `${Math.max(10, baseSize)}px`, // Dynamic font size
                padding: '4px 8px'
            }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(node.id);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={`${node.label}\nTotal: ${node.stats.total}\nWeakness: ${(weaknessScore * 100).toFixed(0)}%`}
        >
            {node.label}
            {/* Show refined visual indicators if needed */}
            {priority === 'critical' && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
        </div>
    );
};
