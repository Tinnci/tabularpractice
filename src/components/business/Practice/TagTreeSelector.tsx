import React, { useState, useMemo } from 'react';
import { EnhancedTagNode } from '@/hooks/useTagStats';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export interface TagTreeSelectorProps {
    tags: EnhancedTagNode[];
    selectedTagIds: Set<string>;
    onTagToggle: (id: string) => void;
    onNodeHover?: (id: string | null) => void;
    className?: string;
    hoveredNodeId?: string | null;
}

export const TagTreeSelector: React.FC<TagTreeSelectorProps> = ({
    tags,
    selectedTagIds,
    onTagToggle,
    onNodeHover,
    className,
    hoveredNodeId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Helper to toggle expansion
    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedNodes(newSet);
    };

    // Memoized display tags with inline filter function
    const displayTags = useMemo(() => {
        const filterNodes = (nodes: EnhancedTagNode[], term: string): EnhancedTagNode[] => {
            if (!term) return nodes;

            return nodes.reduce<EnhancedTagNode[]>((acc, node) => {
                const matches = node.label.toLowerCase().includes(term.toLowerCase());
                const filteredChildren = node.children ? filterNodes(node.children, term) : [];

                if (matches || filteredChildren.length > 0) {
                    acc.push({
                        ...node,
                        children: filteredChildren
                    });
                }
                return acc;
            }, []);
        };

        return filterNodes(tags, searchTerm);
    }, [tags, searchTerm]);

    // Auto-expand on search
    React.useEffect(() => {
        if (searchTerm) {
            const idsToExpand = new Set<string>();
            const traverse = (nodes: EnhancedTagNode[]) => {
                nodes.forEach(node => {
                    // Simple heuristic: expand everything in filtered result
                    idsToExpand.add(node.id);
                    if (node.children) traverse(node.children);
                });
            };
            traverse(displayTags);
            setExpandedNodes(idsToExpand);
        }
    }, [searchTerm, displayTags]); // displayTags changes when searchTerm changes

    const renderNode = (node: EnhancedTagNode) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedTagIds.has(node.id);
        const isHovered = hoveredNodeId === node.id;

        // Determine color based on priority/mastery
        let statusColor = "bg-primary";
        if (node.computed.priority === 'critical') statusColor = "bg-red-500";
        else if (node.computed.priority === 'high') statusColor = "bg-orange-500";
        else if (node.computed.priority === 'medium') statusColor = "bg-yellow-500";
        else if (node.stats.mastered > 0) statusColor = "bg-green-500";
        else statusColor = "bg-muted-foreground/30";

        return (
            <div key={node.id} className="select-none">
                <div
                    className={cn(
                        "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer group",
                        isHovered ? "bg-primary/10" : "hover:bg-muted/50",
                        isSelected && "bg-primary/5"
                    )}
                    onMouseEnter={() => onNodeHover?.(node.id)}
                    onMouseLeave={() => onNodeHover?.(null)}
                >
                    {/* Expand Toggle */}
                    <div
                        className={cn("w-4 h-4 flex items-center justify-center shrink-0", !hasChildren && "invisible")}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(node.id);
                        }}
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </div>

                    {/* Selection Checkbox */}
                    <div onClick={(e) => {
                        e.stopPropagation();
                        onTagToggle(node.id);
                    }}>
                        <Checkbox
                            id={`tag-${node.id}`}
                            checked={isSelected}
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                    </div>

                    {/* Label & Stats */}
                    <div
                        className="flex-1 flex items-center justify-between min-w-0"
                        onClick={() => {
                            // If it has children, toggle expand, otherwise toggle selection?
                            // Or standard behavior: click row -> toggle selection
                            onTagToggle(node.id);
                        }}
                    >
                        <span className={cn("text-sm truncate font-medium", isSelected ? "text-primary" : "text-foreground")}>
                            {node.label}
                        </span>

                        <div className="flex items-center gap-2">
                            {/* Stats Badge */}
                            {node.stats.total > 0 && (
                                <div className="flex items-center gap-1">
                                    <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                                    <span className="text-xs text-muted-foreground w-8 text-right">{node.stats.total}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Children Recursion */}
                {hasChildren && isExpanded && (
                    <div className="ml-4 pl-2 border-l border-border/40 mt-1">
                        {node.children!.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("flex flex-col h-full bg-background/60 backdrop-blur-xl border-l border-primary/10", className)}>
            {/* Header / Search */}
            <div className="p-4 border-b border-primary/10 space-y-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search topics..."
                        className="pl-9 bg-background/50 border-primary/10 focus-visible:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                    <span>{selectedTagIds.size} selected</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs hover:bg-transparent hover:text-primary"
                        onClick={() => {
                            if (selectedTagIds.size > 0) {
                                // We'd need a clear function from parent or pass clear callback
                                // For now we iterate and toggle all? No, that's inefficient.
                                // Let's skip 'Clear All' for this iteration or assume parent handles it
                            }
                        }}
                    >
                        {/* Placeholder for actions */}
                    </Button>
                </div>
            </div>

            {/* Tree Area */}
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-0.5">
                    {displayTags.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No topics found.
                        </div>
                    ) : (
                        displayTags.map(node => renderNode(node))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
