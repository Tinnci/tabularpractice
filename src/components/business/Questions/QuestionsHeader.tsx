import { useMemo } from "react";
import { useProgressStore } from "@/lib/store";
import { useContextQuestions } from "@/hooks/useContextQuestions";
import { DICT } from "@/lib/i18n";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Columns, LayoutGrid } from "lucide-react";
import { GlobalSearch } from "@/components/business/GlobalSearch";
import { Status, PaperGroup } from "@/lib/types";

export interface QuestionsHeaderProps {
    viewMode: 'wall' | 'grid';
    onViewModeChange: (mode: 'wall' | 'grid') => void;
    onShowShortcutsHelp: () => void;
    filteredCount: number;
    onQuestionSelect: (id: string) => void;
}

export function QuestionsHeader({
    viewMode,
    onViewModeChange,
    onShowShortcutsHelp,
    filteredCount,
    onQuestionSelect
}: QuestionsHeaderProps) {
    const {
        progress,
        currentGroupId,
        setCurrentGroupId,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        filterYear,
        setFilterYear,
    } = useProgressStore();

    const { mergedQuestions, paperGroupsData, currentPapers } = useContextQuestions();

    const groupedPaperGroups = useMemo(() => {
        const unified = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'unified');
        const selfProposed = (paperGroupsData as PaperGroup[]).filter(g => g.type === 'self_proposed');
        return { unified, selfProposed };
    }, [paperGroupsData]);

    const availableYears = useMemo(() => {
        const years = currentPapers.map(p => p.year);
        return Array.from(new Set(years)).sort((a, b) => b - a);
    }, [currentPapers]);

    return (
        <div className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-y-3 gap-x-4 bg-background z-20 shadow-sm">
            <div className="flex items-center gap-3 shrink-0">
                <h2 className="text-lg font-semibold text-foreground whitespace-nowrap hidden sm:block">{DICT.wall.title}</h2>
                <Select value={currentGroupId} onValueChange={setCurrentGroupId}>
                    <SelectTrigger className="w-[140px] sm:w-[180px] h-9 border-dashed sm:border-solid">
                        <SelectValue placeholder={DICT.wall.selectGroup} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{DICT.wall.unified}</SelectLabel>
                            {groupedPaperGroups.unified.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectGroup>
                        {groupedPaperGroups.selfProposed.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>{DICT.wall.selfProposed}</SelectLabel>
                                {groupedPaperGroups.selfProposed.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1 justify-start sm:justify-center order-3 sm:order-2 w-full sm:w-auto">
                <div className="flex items-center bg-muted/50 p-1 rounded-lg shrink-0">
                    <ToggleGroup type="single" value={filterStatus} onValueChange={(v) => setFilterStatus((v as Status | 'all') || 'all')} className="gap-0">
                        <ToggleGroupItem value="all" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-accent dark:data-[state=on]:text-accent-foreground">{DICT.common.all}</ToggleGroupItem>
                        <ToggleGroupItem value="unanswered" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-accent dark:data-[state=on]:text-accent-foreground">{DICT.status.unanswered}</ToggleGroupItem>
                        <div className="w-px h-4 bg-border mx-1" />
                        <ToggleGroupItem value="mastered" className="h-7 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900 dark:data-[state=on]:text-green-300">{DICT.status.mastered}</ToggleGroupItem>
                        <ToggleGroupItem value="confused" className="h-7 px-2 text-xs data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 dark:data-[state=on]:bg-yellow-900 dark:data-[state=on]:text-yellow-300">{DICT.status.confused}</ToggleGroupItem>
                        <ToggleGroupItem value="failed" className="h-7 px-2 text-xs data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900 dark:data-[state=on]:text-red-300">{DICT.status.failed}</ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Select value={filterYear} onValueChange={setFilterYear}>
                                        <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-none hover:bg-muted/50">
                                            <span>{filterYear === 'all' ? DICT.wall.year : filterYear}</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{DICT.wall.allYears}</SelectItem>
                                            {availableYears.map(year => (
                                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{DICT.shortcuts.toggleYear}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Select value={filterType} onValueChange={(val) => setFilterType(val as 'all' | 'choice' | 'fill' | 'answer')}>
                        <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-none hover:bg-muted/50">
                            <span>{filterType === 'all' ? DICT.wall.type : (filterType === 'choice' ? DICT.wall.choice : filterType === 'fill' ? DICT.wall.fill : DICT.wall.answer)}</span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{DICT.wall.allTypes}</SelectItem>
                            <SelectItem value="choice">{DICT.wall.choice}</SelectItem>
                            <SelectItem value="fill">{DICT.wall.fill}</SelectItem>
                            <SelectItem value="answer">{DICT.wall.answer}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && onViewModeChange(v as 'wall' | 'grid')} className="mr-2">
                    <ToggleGroupItem value="wall" aria-label="Wall View" className="h-8 w-8 hover:bg-muted/50">
                        <Columns className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="Grid View" className="h-8 w-8 hover:bg-muted/50">
                        <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onShowShortcutsHelp}>
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{DICT.nav.shortcuts}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <GlobalSearch questions={mergedQuestions} onQuestionSelect={onQuestionSelect} />

                <div className="hidden lg:flex flex-col items-end text-[10px] text-muted-foreground border-l pl-3 leading-tight">
                    <span>{DICT.wall.totalCount.replace('{count}', filteredCount.toString())}</span>
                    <span>{DICT.wall.doneCount.replace('{count}', Object.keys(progress).length.toString())}</span>
                </div>
            </div>
        </div>
    );
}
