"use client";

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, RefreshCw, FileText, Layers } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { useProgressStore } from "@/lib/store"
import { usePapers } from "@/hooks/usePapers"
import { usePaperGroups } from "@/hooks/useQuestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

function PaperGroupFilterSection() {
    const { hiddenGroupIds, toggleGroupVisibility } = useProgressStore()
    const { paperGroups, isLoading } = usePaperGroups()

    if (isLoading) return <div className="text-sm text-muted-foreground">{DICT.common.loading}</div>
    if (!paperGroups || paperGroups.length === 0) return <div className="text-sm text-muted-foreground">{DICT.wall.noPapers}</div>

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Layers className="h-4 w-4" />
                {DICT.settings.paperGroupFilter}
            </h3>
            <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-xs text-muted-foreground mb-3">
                    {DICT.settings.paperGroupFilterDesc}
                </div>
                <ScrollArea className="h-[200px] pr-3">
                    <div className="grid grid-cols-1 gap-2">
                        {paperGroups.map(group => (
                            <div key={group.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card/60 hover:bg-accent/50 transition-colors">
                                <div className="space-y-1 overflow-hidden mr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate block" title={group.name}>
                                            {group.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] h-5 px-1.5 font-normal ${group.type === 'unified' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}
                                        >
                                            {group.type === 'unified' ? DICT.wall.unified : DICT.wall.selfProposed}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {/* Placeholder for description if available in future */}
                                        {group.type === 'unified' ? DICT.subjects.unified : DICT.subjects.selfProposed}
                                    </div>
                                </div>
                                <Switch
                                    checked={!hiddenGroupIds.includes(group.id)}
                                    onCheckedChange={() => toggleGroupVisibility(group.id)}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

function PaperFilterSection() {
    const { hiddenPaperIds, togglePaperVisibility } = useProgressStore()
    const { papers, isLoading, mutate } = usePapers()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await mutate()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    if (isLoading) return <div className="text-sm text-muted-foreground">{DICT.common.loading}</div>
    if (!papers || papers.length === 0) return <div className="text-sm text-muted-foreground">{DICT.wall.noPapers}</div>

    const sortedPapers = [...papers].sort((a, b) => b.year - a.year)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4" />
                    {DICT.settings.paperFilter}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>
            <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-xs text-muted-foreground mb-3">{DICT.settings.paperFilterDesc}</div>
                <ScrollArea className="h-[200px] pr-3">
                    <div className="space-y-3">
                        {sortedPapers.map(paper => (
                            <div key={paper.id} className="flex items-center justify-between">
                                <div className="space-y-0.5 overflow-hidden mr-2">
                                    <label className="text-sm font-medium truncate block" title={paper.name}>{paper.name}</label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{paper.year}年</span>
                                        {paper.sourceUrl !== undefined && (
                                            <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] truncate max-w-[120px]">
                                                {paper.sourceUrl === '' ? DICT.settings.local : 'Remote'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Switch
                                    checked={!hiddenPaperIds.includes(paper.id)}
                                    onCheckedChange={() => togglePaperVisibility(paper.id)}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

export function AppearanceFilter() {
    const { appearance, setAppearance } = useProgressStore()

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Settings className="h-4 w-4" />
                    {DICT.settings.theme}
                </h3>
                <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium leading-none">{DICT.settings.appearance.compact}</label>
                            <p className="text-xs text-muted-foreground">{DICT.settings.appearance.compactDesc}</p>
                        </div>
                        <Switch
                            checked={appearance.compactMode}
                            onCheckedChange={(checked) => setAppearance({ compactMode: checked })}
                        />
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span>{DICT.settings.appearance.cardWidth}</span>
                                <span className="text-muted-foreground">{appearance.cardWidth}px</span>
                            </div>
                            <input
                                type="range" min="140" max="300" step="10"
                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                value={appearance.cardWidth}
                                onChange={(e) => setAppearance({ cardWidth: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span>{DICT.settings.appearance.cardHeight}</span>
                                <span className="text-muted-foreground">{appearance.cardHeight}px</span>
                            </div>
                            <input
                                type="range" min="48" max="120" step="4"
                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                value={appearance.cardHeight}
                                onChange={(e) => setAppearance({ cardHeight: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <PaperGroupFilterSection />
            <PaperFilterSection />
        </div>
    )
}
