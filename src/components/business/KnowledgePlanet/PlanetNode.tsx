import React from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { cn } from '@/lib/utils';

interface PlanetNodeProps {
    node: EnhancedTagNode;
    x: number;
    y: number;
    isSelected: boolean;
    isHovered?: boolean;
    onClick: (id: string) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const PlanetNode: React.FC<PlanetNodeProps> = ({
    node,
    x,
    y,
    isSelected,
    isHovered,
    onClick,
    onMouseEnter,
    onMouseLeave,
}) => {
    // Determine color/style based on priority/status
    const { priority, weaknessScore, sizeMultiplier } = node.computed;

    // Base size (e.g. 12px to 24px)
    const baseSize = 8 + (sizeMultiplier * 4);

    let colorClass = "bg-muted text-muted-foreground border-border";
    let glowClass = "";

    // Status Logic
    if (node.stats.total > 0) {
        if (priority === 'critical') {
            colorClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
            glowClass = "shadow-[0_0_15px_rgba(239,68,68,0.4)]";
        } else if (priority === 'high') {
            colorClass = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
        } else if (priority === 'medium') {
            colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
        } else {
            // Mastered
            if (node.stats.mastered > 0 && node.stats.failed === 0) {
                colorClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
            } else {
                colorClass = "bg-background text-foreground border-border";
            }
        }
    }

    if (isSelected) {
        colorClass = "bg-primary text-primary-foreground border-primary";
        glowClass = "shadow-[0_0_20px_rgba(var(--primary),0.6)] ring-2 ring-primary/30";
    }

    // Dynamic z-index: Selected/Hovered always on top
    const zIndex = isHovered ? 50 : (isSelected ? 40 : 10);
    const scale = isHovered ? 1.15 : 1;

    return (
        <div
            className={cn(
                "absolute cursor-pointer select-none flex items-center justify-center rounded-full border shadow-sm transition-all duration-300 ease-out",
                colorClass,
                glowClass
            )}
            style={{
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
                fontSize: `${Math.max(10, baseSize)}px`,
                padding: '0.3em 0.8em',
                zIndex,
            }}
            onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onClick(node.id);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={`${node.label}\nTotal: ${node.stats.total}\nWeakness: ${(weaknessScore * 100).toFixed(0)}%`}
        >
            <span className="whitespace-nowrap font-medium">{node.label}</span>

            {priority === 'critical' && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
        </div>
    );
};
