"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useContextQuestions } from "@/hooks/useContextQuestions";
import { QuestionModal } from "@/components/business/QuestionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useStopwatch } from "@/hooks/useStopwatch";
import { Timer, Pause, Play, Dumbbell, Filter, Shuffle, Tag, RotateCcw } from "lucide-react";
import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store";
import tagsData from "@/data/tags.json";
import { pinyin } from "pinyin-pro";

export default function PracticePage() {
    const { mergedQuestions } = useContextQuestions();
    const { updateStatus, addTime, practiceSession, setPracticeSession, updatePracticeSessionProgress } = useProgressStore();

    // Create a map of tag ID to label
    const tagMap = useMemo(() => {
        interface TagNode {
            id: string;
            label: string;
            children?: TagNode[];
        }

        const map = new Map<string, string>();
        const traverse = (nodes: TagNode[]) => {
            for (const node of nodes) {
                // Map original ID (English)
                map.set(node.id, node.label);

                // Map Pinyin ID (for compatibility with pinyin-slugified data)
                // 1. Clean punctuation (remove non-alphanumeric/non-Chinese)
                const cleanLabel = node.label.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

                // 2. Generate slug with 'v' for 'ü'
                const slug = pinyin(cleanLabel, { toneType: 'none', type: 'array', v: true }).join('-');
                map.set(slug, node.label);

                if (node.children) {
                    traverse(node.children);
                }
            }
        };
        // Cast imported JSON to TagNode[] as it's structurally compatible
        traverse(tagsData as unknown as TagNode[]);

        // Manual Overrides for Polyphones or incorrect data slugs
        map.set('xing-lie-shi', '行列式'); // Standard is 'hang-lie-shi', but data uses 'xing'

        return map;
    }, []);

    // Configuration State
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['choice', 'fill', 'answer']));
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [isShuffle, setIsShuffle] = useState(false);

    // Session State
    const [isStarted, setIsStarted] = useState(false);
    const [queue, setQueue] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Timer Hook
    const {
        elapsed,
        formattedTime,
        isRunning,
        toggle: toggleTimer,
        reset: resetTimer,
        start: startTimer,
        pause: pauseTimer
    } = useStopwatch({
        autoStart: false,
        smartPause: true
    });

    // Performance Optimization: Use ref to access elapsed time in callbacks without triggering re-renders
    // Performance Optimization: Use ref to access elapsed time in callbacks without triggering re-renders
    const elapsedRef = useRef(0);
    useEffect(() => {
        elapsedRef.current = elapsed;
    }, [elapsed]);

    // Restore session
    useEffect(() => {
        if (!isStarted && practiceSession && practiceSession.isActive && mergedQuestions.length > 0) {
            // Reconstruct queue
            const queueMap = new Map(mergedQuestions.map(q => [q.id, q]));
            const restoredQueue = practiceSession.queueIds
                .map(id => queueMap.get(id))
                .filter(q => !!q) as Question[];

            if (restoredQueue.length > 0) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                setQueue(restoredQueue);
                setCurrentIndex(practiceSession.currentIndex);
                setSelectedTypes(new Set(practiceSession.settings.types));
                setSelectedTags(new Set(practiceSession.settings.tags));
                setIsShuffle(practiceSession.settings.isShuffle);
                setIsStarted(true);
                // Don't auto-open modal on restore, let user click "Continue"
                // Or maybe open it? The user might have refreshed while in the middle of a question.
                // Let's open it if they were in the middle.
                setIsModalOpen(true);
            }
        }
    }, [practiceSession, mergedQuestions, isStarted]);

    // Derived Data
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        mergedQuestions.forEach(q => {
            q.tags?.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [mergedQuestions]);

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

    // Handlers
    const toggleType = (type: string) => {
        const newTypes = new Set(selectedTypes);
        if (newTypes.has(type)) {
            newTypes.delete(type);
        } else {
            newTypes.add(type);
        }
        setSelectedTypes(newTypes);
    };

    const toggleTag = (tag: string) => {
        const newTags = new Set(selectedTags);
        if (newTags.has(tag)) {
            newTags.delete(tag);
        } else {
            newTags.add(tag);
        }
        setSelectedTags(newTags);
    };

    const handleStart = () => {
        const filtered = mergedQuestions.filter(q => {
            if (!selectedTypes.has(q.type)) return false;
            if (selectedTags.size > 0) {
                const hasTag = q.tags?.some(t => selectedTags.has(t));
                if (!hasTag) return false;
            }
            return true;
        });

        if (isShuffle) {
            // Fisher-Yates Shuffle
            for (let i = filtered.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
            }
        }

        setQueue(filtered);
        setCurrentIndex(0);
        setIsStarted(true);
        setIsModalOpen(true);

        // Save session
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

        // Start timer
        resetTimer();
        startTimer();
    };

    const handleEndSession = () => {
        // Save time for current question
        if (queue[currentIndex]) {
            addTime(queue[currentIndex].id, elapsedRef.current);
        }
        setIsStarted(false);
        setQueue([]);
        setCurrentIndex(0);
        setIsModalOpen(false);
        resetTimer();
        setPracticeSession(null);
    };

    const handleNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            // Save time for current question
            if (queue[currentIndex]) {
                addTime(queue[currentIndex].id, elapsedRef.current);
            }
            resetTimer();
            startTimer();
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            updatePracticeSessionProgress(newIndex);
        }
    }, [currentIndex, queue, resetTimer, startTimer, addTime, updatePracticeSessionProgress]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            // Save time for current question
            if (queue[currentIndex]) {
                addTime(queue[currentIndex].id, elapsedRef.current);
            }
            resetTimer();
            startTimer();
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            updatePracticeSessionProgress(newIndex);
        }
    }, [currentIndex, queue, resetTimer, startTimer, addTime, updatePracticeSessionProgress]);

    // Current Question
    const currentQuestion = queue[currentIndex];

    if (isStarted) {
        return (
            <div className="container mx-auto p-6 max-w-4xl h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
                <Card className="w-full max-w-md text-center p-8 shadow-xl border-primary/20 relative">
                    {/* Timer UI */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                        <Timer className={cn("w-4 h-4", isRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
                        <span className="font-mono font-bold text-lg min-w-[60px]">{formattedTime}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={toggleTimer}>
                            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                    </div>

                    <div className="mb-6 flex justify-center">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <Dumbbell className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Practice Session Active</h2>
                    <p className="text-muted-foreground mb-8">
                        Question {currentIndex + 1} of {queue.length}
                    </p>

                    <div className="flex flex-col gap-4">
                        <Button size="lg" onClick={() => {
                            setIsModalOpen(true);
                            startTimer();
                        }} className="w-full gap-2">
                            <Play className="w-4 h-4" /> Continue Practice
                        </Button>
                        <Button variant="outline" onClick={handleEndSession} className="w-full gap-2">
                            <RotateCcw className="w-4 h-4" /> End Session
                        </Button>
                    </div>
                </Card>

                <QuestionModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        pauseTimer();
                    }}
                    question={currentQuestion}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    hasNext={currentIndex < queue.length - 1}
                    hasPrev={currentIndex > 0}
                    onUpdateStatus={updateStatus}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Dumbbell className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Custom Practice</h1>
                    <p className="text-muted-foreground">Configure your practice session to focus on specific areas.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration Card */}
                <Card className="md:col-span-2 border-primary/10 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            Session Settings
                        </CardTitle>
                        <CardDescription>
                            Filter questions by type and tags, or shuffle them for a random challenge.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Question Types */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Question Types</Label>
                            <div className="flex flex-wrap gap-4">
                                {['choice', 'fill', 'answer'].map(type => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`type-${type}`}
                                            checked={selectedTypes.has(type)}
                                            onCheckedChange={() => toggleType(type)}
                                        />
                                        <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                                            {type === 'choice' ? 'Multiple Choice' : type === 'fill' ? 'Fill in the Blank' : 'Short Answer'}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Shuffle Option */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Shuffle className="w-4 h-4" /> Random Shuffle
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Randomize the order of questions in this session.
                                </p>
                            </div>
                            <Switch
                                checked={isShuffle}
                                onCheckedChange={setIsShuffle}
                            />
                        </div>

                        {/* 3. Tags */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Tags ({selectedTags.size} selected)
                            </Label>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-background/50">
                                {allTags.length === 0 && (
                                    <p className="text-sm text-muted-foreground p-2">No tags available.</p>
                                )}
                                {allTags.map(tagId => (
                                    <Badge
                                        key={tagId}
                                        variant={selectedTags.has(tagId) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer transition-all hover:scale-105 active:scale-95 select-none px-3 py-1",
                                            selectedTags.has(tagId) ? "shadow-md shadow-primary/20" : "hover:bg-muted"
                                        )}
                                        onClick={() => toggleTag(tagId)}
                                    >
                                        {tagMap.get(tagId) || tagId}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t bg-muted/10 p-6">
                        <div className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">{filteredCount}</span> questions match your criteria.
                        </div>
                        <Button
                            size="lg"
                            onClick={handleStart}
                            disabled={filteredCount === 0}
                            className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Play className="w-5 h-5" /> Start Practice
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
