import { Button } from "@/components/ui/button";
import { TagNode } from "@/data/subject-tags";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarLeafNodeProps {
    node: TagNode;
    selectedTagId: string | null;
    stat: { total: number; finished: number };
    onSelect: (id: string | null) => void;
}

export function SidebarLeafNode({ node, selectedTagId, stat, onSelect }: SidebarLeafNodeProps) {
    const isSelected = selectedTagId === node.id;
    // Calculate completion color
    const isComplete = stat.total > 0 && stat.finished === stat.total;
    const width = stat.total > 0 ? (stat.finished / stat.total) * 100 : 0;

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
                <div className="relative group/leaf px-1 py-0.5">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between text-sm h-8 pl-6 pr-2 font-normal relative transition-all duration-200 overflow-hidden",
                            isSelected
                                ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                            stat.total === 0 && "opacity-60"
                        )}
                        onClick={() => {
                            // Click interaction
                            if (isSelected) onSelect(null);
                            else onSelect(node.id);
                        }}
                    >
                        {/* Progress background bar - faintly visible only on hover or selected and present */}
                        {stat.finished > 0 && (
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-500 z-0"
                                style={{ width: `${width}%` }}
                            />
                        )}

                        <div className="flex items-center gap-2 z-10 min-w-0 flex-1">
                            {/* Dot icon */}
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full transition-all duration-300 shrink-0",
                                isSelected
                                    ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary))]"
                                    : isComplete ? "bg-green-500/50" : "bg-muted-foreground/30 group-hover/leaf:bg-primary/60"
                            )} />
                            <span className={cn("truncate leading-none", isSelected && "font-semibold")}>
                                {node.label}
                            </span>
                        </div>

                        {/* Right side Badge */}
                        {stat.total > 0 && (
                            <span className={cn(
                                "text-[10px] tabular-nums px-1.5 py-0.5 rounded-full z-10 transition-colors",
                                isSelected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover/leaf:bg-muted"
                            )}>
                                {stat.finished}/{stat.total}
                            </span>
                        )}
                    </Button>

                    {/* Selection Indicator (Left Edge) */}
                    {isSelected && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_hsl(var(--primary))]" />
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent side="right">
                <div className="text-xs">
                    <p className="font-semibold">{node.label}</p>
                    <p className="text-muted-foreground">已完成 {stat.finished} / 共 {stat.total} 题</p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
