"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useContextQuestions } from "@/hooks/useContextQuestions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStopwatch } from "@/hooks/useStopwatch";
import { Play, Shuffle, PanelLeftClose, PanelLeft, LayoutDashboard } from "lucide-react";
import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import { DICT } from "@/lib/i18n";
import { KnowledgePlanet } from "@/components/business/KnowledgePlanet";
import { useTagStats } from "@/hooks/useTagStats";
import { getSubjectKey } from "@/lib/subjectConfig";
import { TagTreeSelector } from "@/components/business/Practice/TagTreeSelector";
import { PracticeCardStack } from "@/components/business/Practice/PracticeCardStack";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientOnly } from "@/components/ui/ClientOnly";

// Define session state type for better type safety
interface PracticeSessionState {
    isStarted: boolean;
    queue: Question[];
    currentIndex: number;
    isModalOpen: boolean;
    selectedTypes: Set<string>;
    selectedTags: Set<string>;
    isShuffle: boolean;
}

// Default session state
const DEFAULT_SESSION_STATE: PracticeSessionState = {
    isStarted: false,
    queue: [],
    currentIndex: 0,
    isModalOpen: false,
    selectedTypes: new Set(['choice', 'fill', 'answer']),
    selectedTags: new Set(),
    isShuffle: false,
};

export default function PracticePage() {
    const { mergedQuestions } = useContextQuestions();
    const { updateStatus, addTime, practiceSession, setPracticeSession, updatePracticeSessionProgress, currentGroupId } = useProgressStore();
    const subjectKey = useMemo(() => getSubjectKey(currentGroupId || 'math'), [currentGroupId]);

    // Get both Tree and Flat structures
    const { enhancedTags, flatEnhancedTags } = useTagStats(mergedQuestions, subjectKey);

    // Combined session state
    const [sessionState, setSessionState] = useState<PracticeSessionState>(DEFAULT_SESSION_STATE);

    // UI State (not part of session)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // Timer Hook
    const {
        elapsed,
        formattedTime,
        isRunning,
        toggle: toggleTimer,
        reset: resetTimer,
        start: startTimer
    } = useStopwatch({
        autoStart: false,
        smartPause: true
    });

    const elapsedRef = useRef(0);
    useEffect(() => {
        elapsedRef.current = elapsed;
    }, [elapsed]);

    // Session restoration from persisted zustand store
    // This is a legitimate pattern for syncing external store state to component state
    // The React team acknowledges this pattern requires setState in effect
    const sessionRestoredRef = useRef(false);
    useEffect(() => {
        if (sessionRestoredRef.current || sessionState.isStarted) return;
        if (!practiceSession || !practiceSession.isActive || mergedQuestions.length === 0) return;

        const queueMap = new Map(mergedQuestions.map(q => [q.id, q]));
        const restoredQueue = practiceSession.queueIds
            .map(id => queueMap.get(id))
            .filter(Boolean) as Question[];

        if (restoredQueue.length > 0) {
            sessionRestoredRef.current = true;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: Syncing from external zustand store on mount
            setSessionState({
                isStarted: true,
                queue: restoredQueue,
                currentIndex: practiceSession.currentIndex,
                isModalOpen: true,
                selectedTypes: new Set(practiceSession.settings.types),
                selectedTags: new Set(practiceSession.settings.tags),
                isShuffle: practiceSession.settings.isShuffle,
            });
        }
    }, [practiceSession, mergedQuestions, sessionState.isStarted]);

    // Destructure for easier access
    const { isStarted, queue, currentIndex, selectedTypes, selectedTags, isShuffle } = sessionState;



    const filteredCount = useMemo(() => {
        return mergedQuestions.filter(q => {
            if (!selectedTypes.has(q.type)) return false;
            if (selectedTags.size > 0) {
                const hasTag = q.tags?.some(t => selectedTags.has(t));
                if (!hasTag) return false;
            }
            return true;
        }).length;
    }, [mergedQuestions, selectedTypes, selectedTags]);

    // Handlers - all use setSessionState for atomic updates
    const toggleType = useCallback((type: string) => {
        setSessionState(prev => {
            const newTypes = new Set(prev.selectedTypes);
            if (newTypes.has(type)) newTypes.delete(type);
            else newTypes.add(type);
            return { ...prev, selectedTypes: newTypes };
        });
    }, []);

    const toggleTag = useCallback((tag: string) => {
        setSessionState(prev => {
            const newTags = new Set(prev.selectedTags);
            if (newTags.has(tag)) newTags.delete(tag);
            else newTags.add(tag);
            return { ...prev, selectedTags: newTags };
        });
    }, []);

    const setIsShuffle = useCallback((value: boolean) => {
        setSessionState(prev => ({ ...prev, isShuffle: value }));
    }, []);

    const handleStart = useCallback(() => {
        const filtered = mergedQuestions.filter(q => {
            if (!selectedTypes.has(q.type)) return false;
            if (selectedTags.size > 0) {
                const hasTag = q.tags?.some(t => selectedTags.has(t));
                if (!hasTag) return false;
            }
            return true;
        });

        if (isShuffle) {
            for (let i = filtered.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
            }
        }

        // Single atomic state update
        setSessionState(prev => ({
            ...prev,
            queue: filtered,
            currentIndex: 0,
            isStarted: true,
            isModalOpen: true,
        }));

        setPracticeSession({
            isActive: true,
            queueIds: filtered.map(q => q.id),
            currentIndex: 0,
            settings: {
                types: Array.from(selectedTypes),
                tags: Array.from(selectedTags),
                isShuffle
            }
        });

        resetTimer();
        startTimer();
    }, [mergedQuestions, selectedTypes, selectedTags, isShuffle, setPracticeSession, resetTimer, startTimer]);

    const handleEndSession = useCallback(() => {
        if (queue[currentIndex]) {
            addTime(queue[currentIndex].id, elapsedRef.current);
        }

        // Single atomic state update
        setSessionState(prev => ({
            ...prev,
            isStarted: false,
            queue: [],
            currentIndex: 0,
            isModalOpen: false,
        }));

        resetTimer();
        setPracticeSession(null);
    }, [queue, currentIndex, addTime, resetTimer, setPracticeSession]);

    const handleNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            if (queue[currentIndex]) {
                addTime(queue[currentIndex].id, elapsedRef.current);
            }
            resetTimer();
            startTimer();
            const newIndex = currentIndex + 1;
            setSessionState(prev => ({ ...prev, currentIndex: newIndex }));
            updatePracticeSessionProgress(newIndex);
        }
    }, [currentIndex, queue, resetTimer, startTimer, addTime, updatePracticeSessionProgress]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            if (queue[currentIndex]) {
                addTime(queue[currentIndex].id, elapsedRef.current);
            }
            resetTimer();
            startTimer();
            const newIndex = currentIndex - 1;
            setSessionState(prev => ({ ...prev, currentIndex: newIndex }));
            updatePracticeSessionProgress(newIndex);
        }
    }, [currentIndex, queue, resetTimer, startTimer, addTime, updatePracticeSessionProgress]);



    // Session Active View - Immersive Card Stack
    if (isStarted) {
        return (
            <PracticeCardStack
                queue={queue}
                currentIndex={currentIndex}
                onNext={handleNext}
                onPrev={handlePrev}
                onUpdateStatus={updateStatus}
                onEndSession={handleEndSession}
                formattedTime={formattedTime}
                isTimerRunning={isRunning}
                toggleTimer={toggleTimer}
            />
        );
    }

    // Config / Planet View
    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden relative">

            {/* 3D Planet Area */}
            <div className="flex-1 relative h-full bg-radial-gradient from-background to-muted/20">
                <ClientOnly fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading Knowledge Planet...</div>
                    </div>
                }>
                    <KnowledgePlanet
                        tags={flatEnhancedTags}
                        selectedTagIds={selectedTags}
                        onTagToggle={toggleTag}
                        className="w-full h-full"
                        hoveredNodeId={hoveredNodeId}
                    />
                </ClientOnly>

                {/* Overlay Title */}
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                        {DICT.practice.customPractice}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Visualize your knowledge galaxy. Select nodes to generate a customized practice session.
                    </p>
                </div>

                {/* Sidebar Toggle (Mobile/Tablet) */}
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-6 right-6 z-20 md:hidden shadow-lg"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Right Sidebar Control Panel */}
            <div className={cn(
                "w-full md:w-[400px] border-l bg-background/80 backdrop-blur-xl absolute md:relative z-20 h-full transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none flex flex-col",
                isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
                "right-0 top-0"
            )}>
                {/* Header Actions */}
                <div className="p-6 pb-2 shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Configuration</span>
                        </div>
                        <Button
                            onClick={handleStart}
                            disabled={filteredCount === 0}
                            className="shadow-lg shadow-primary/20"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start ({filteredCount})
                        </Button>
                    </div>

                    {/* Filters: Type & Shuffle */}
                    <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 p-3 rounded-lg border">
                        <div className="col-span-2 flex items-center gap-4 border-b border-border/50 pb-2 mb-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Type</Label>
                            <div className="flex gap-3">
                                {['choice', 'fill', 'answer'].map(type => (
                                    <div key={type} className="flex items-center space-x-1.5">
                                        <Checkbox
                                            id={`type-${type}`}
                                            checked={selectedTypes.has(type)}
                                            onCheckedChange={() => toggleType(type)}
                                            className="w-3.5 h-3.5"
                                        />
                                        <Label htmlFor={`type-${type}`} className="text-xs capitalize cursor-pointer">
                                            {type === 'choice' ? DICT.wall.choice : type === 'fill' ? DICT.wall.fill : DICT.wall.answer}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer" htmlFor="shuffle-mode">
                                <Shuffle className="w-3 h-3" /> {DICT.practice.randomShuffle}
                            </Label>
                            <Switch
                                id="shuffle-mode"
                                checked={isShuffle}
                                onCheckedChange={setIsShuffle}
                                className="scale-75 origin-right"
                            />
                        </div>
                    </div>
                </div>

                {/* Tree Selector */}
                <div className="flex-1 min-h-0 relative">
                    <TagTreeSelector
                        tags={enhancedTags}
                        selectedTagIds={selectedTags}
                        onTagToggle={toggleTag}
                        hoveredNodeId={hoveredNodeId}
                        onNodeHover={setHoveredNodeId}
                        className="h-full border-none bg-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
