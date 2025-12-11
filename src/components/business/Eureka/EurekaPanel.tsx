"use client";

import { useState, useEffect, useRef } from "react";
import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbulb, Timer, X, BrainCircuit, Sparkles, HelpCircle, Check, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/components/question";
import { DICT } from "@/lib/i18n";

interface Props {
    question: Question | null;
    onClose: () => void;
    className?: string;
}

const INCUBATION_TIME = 5 * 60; // 5 minutes in seconds

export function EurekaPanel({ question, onClose, className }: Props) {
    // --- Timer Logic ---
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(INCUBATION_TIME);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Interactive States ---
    const [selectedBlocker, setSelectedBlocker] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [showInsight, setShowInsight] = useState(false);

    const startTimer = () => {
        if (isTimerRunning) return;
        setIsTimerRunning(true);
        setTimeLeft(INCUBATION_TIME);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsTimerRunning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTimerRunning(false);
        setTimeLeft(INCUBATION_TIME);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        // Reset interactive states when question changes
        setSelectedBlocker(null);
        setSelectedModel(null);
        setShowInsight(false);
    }, [question?.id]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const eurekaData = question?.eureka;
    const hasInteractiveContent = eurekaData?.diagnostic || eurekaData?.modelLineup || eurekaData?.variableRoles;

    // --- Fallback: Generic Heuristics ---
    const genericHeuristics = [
        {
            id: "representation",
            title: DICT.eureka.representation,
            icon: <BrainCircuit className="w-4 h-4 text-purple-500" />,
            desc: DICT.eureka.representationDesc,
            prompts: [
                DICT.eureka.representationQ1,
                DICT.eureka.representationQ2,
                DICT.eureka.representationQ3
            ]
        },
        {
            id: "function",
            title: DICT.eureka.functionalFixedness,
            icon: <Sparkles className="w-4 h-4 text-orange-500" />,
            desc: DICT.eureka.functionalFixednessDesc,
            prompts: [
                DICT.eureka.functionalFixednessQ1,
                DICT.eureka.functionalFixednessQ2,
                DICT.eureka.functionalFixednessQ3
            ]
        },
        {
            id: "constraint",
            title: DICT.eureka.constraintRelaxation,
            icon: <HelpCircle className="w-4 h-4 text-blue-500" />,
            desc: DICT.eureka.constraintRelaxationDesc,
            prompts: [
                DICT.eureka.constraintRelaxationQ1,
                DICT.eureka.constraintRelaxationQ2,
                DICT.eureka.constraintRelaxationQ3
            ]
        },
        {
            id: "analogy",
            title: DICT.eureka.analogy,
            icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
            desc: DICT.eureka.analogyDesc,
            prompts: [
                DICT.eureka.analogyQ1,
                DICT.eureka.analogyQ2,
                DICT.eureka.analogyQ3
            ]
        }
    ];

    return (
        <div className={cn("flex flex-col h-full bg-background border-l", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                    <span>{DICT.eureka.title}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">

                    {/* 1. Diagnostic Selector (交互式诊断) */}
                    {eurekaData?.diagnostic && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-primary" />
                                {eurekaData.diagnostic.question}
                            </h3>
                            <div className="space-y-2">
                                {eurekaData.diagnostic.options.map((option, idx) => (
                                    <Card
                                        key={idx}
                                        className={cn(
                                            "p-3 cursor-pointer transition-all border-2",
                                            selectedBlocker === option.type
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                        onClick={() => setSelectedBlocker(option.type)}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={cn(
                                                "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                selectedBlocker === option.type ? "border-primary bg-primary" : "border-muted-foreground"
                                            )}>
                                                {selectedBlocker === option.type && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{option.label}</div>
                                                {selectedBlocker === option.type && (
                                                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded animate-in fade-in">
                                                        💡 {option.hint}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Model Lineup (模型配对) */}
                    {eurekaData?.modelLineup && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-primary" />
                                {eurekaData.modelLineup.question}
                            </h3>
                            <div className="space-y-2">
                                {eurekaData.modelLineup.options.map((option) => {
                                    const isSelected = selectedModel === option.id;
                                    const showFeedback = isSelected;

                                    return (
                                        <Card
                                            key={option.id}
                                            className={cn(
                                                "p-3 cursor-pointer transition-all border-2",
                                                isSelected
                                                    ? option.isCorrect
                                                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                        : "border-red-500 bg-red-50 dark:bg-red-950/20"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => setSelectedModel(option.id)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={cn(
                                                    "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                    isSelected
                                                        ? option.isCorrect
                                                            ? "border-green-500 bg-green-500"
                                                            : "border-red-500 bg-red-500"
                                                        : "border-muted-foreground"
                                                )}>
                                                    {isSelected && (
                                                        option.isCorrect
                                                            ? <Check className="w-3 h-3 text-white" />
                                                            : <X className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{option.label}</div>
                                                    {option.formula && (
                                                        <div className="mt-1 text-xs font-mono bg-muted/30 p-1 rounded">
                                                            {option.formula}
                                                        </div>
                                                    )}
                                                    {showFeedback && (
                                                        <div className={cn(
                                                            "mt-2 text-xs p-2 rounded animate-in fade-in",
                                                            option.isCorrect
                                                                ? "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
                                                                : "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300"
                                                        )}>
                                                            {option.isCorrect ? "✓ " : "✗ "}{option.feedback}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Variable Role Cards (变量角色卡) */}
                    {eurekaData?.variableRoles && eurekaData.variableRoles.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                {DICT.eureka.perspectiveSwitch}
                            </h3>
                            <div className="space-y-2">
                                {eurekaData.variableRoles.map((role, idx) => (
                                    <Card key={idx} className="p-3 border-2 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-0.5 bg-background rounded font-mono text-xs">
                                                    {role.target}
                                                </code>
                                                <span className="text-muted-foreground">→</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <div className="text-muted-foreground">{DICT.eureka.currentView}</div>
                                                    <div className="font-medium">{role.currentRole}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">{DICT.eureka.suggestView}</div>
                                                    <div className="font-medium text-orange-700 dark:text-orange-400">{role.suggestedRole}</div>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-orange-200 dark:border-orange-900">
                                                <div className="text-xs text-muted-foreground mb-1">{DICT.eureka.tryThis}</div>
                                                <div className="text-sm bg-background px-2 py-1 rounded">
                                                    <MarkdownContent content={role.transformation} />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. Insight Reveal (关键洞察) */}
                    {eurekaData?.insight && (
                        <div className="space-y-2">
                            {!showInsight ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-2 hover:border-primary"
                                    onClick={() => setShowInsight(true)}
                                >
                                    <Lightbulb className="w-4 h-4 mr-2" />
                                    {DICT.eureka.viewKeyInsight}
                                </Button>
                            ) : (
                                <Card className="p-4 border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20 animate-in fade-in">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                        <div className="text-sm leading-relaxed">{eurekaData.insight}</div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* 5. Incubation Timer */}
                    <div className="bg-muted/30 rounded-xl p-4 border space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                {DICT.eureka.incubation}
                            </h3>
                            {isTimerRunning && (
                                <Badge variant={timeLeft === 0 ? "destructive" : "secondary"} className="font-mono">
                                    {formatTime(timeLeft)}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {DICT.eureka.incubationDesc}
                        </p>

                        {!isTimerRunning ? (
                            <Button size="sm" variant="outline" className="w-full" onClick={startTimer}>
                                {DICT.eureka.imStuck}
                            </Button>
                        ) : timeLeft === 0 ? (
                            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded text-center font-medium animate-pulse">
                                {DICT.eureka.timeUp}
                            </div>
                        ) : (
                            <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={stopTimer}>
                                {DICT.eureka.cancelTimer}
                            </Button>
                        )}
                    </div>

                    {/* 6. Fallback: Generic Heuristics (如果没有特定数据) */}
                    {!hasInteractiveContent && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">{DICT.eureka.generalStrategies}</h3>
                            <Accordion type="single" collapsible className="w-full">
                                {genericHeuristics.map((item) => (
                                    <AccordionItem key={item.id} value={item.id}>
                                        <AccordionTrigger className="text-sm py-3">
                                            <div className="flex items-center gap-2 text-left">
                                                {item.icon}
                                                <span>{item.title}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="px-1 py-1 space-y-3">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {item.desc}
                                                </p>
                                                <ul className="text-xs space-y-2 list-disc pl-4 text-muted-foreground">
                                                    {item.prompts.map((p, i) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    )}

                </div>
            </ScrollArea>
        </div>
    );
}
