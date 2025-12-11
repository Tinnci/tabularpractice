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
            title: "1. 表征重构 (Representation)",
            icon: <BrainCircuit className="w-4 h-4 text-purple-500" />,
            desc: "试着打破你对题目第一眼的'固有印象'。",
            prompts: [
                "如果我不按现在的顺序做，还有别的路吗？(例如：交换积分次序)",
                "把这个复杂的式子拆开看(Chunking)，或者合起来看？",
                "回到定义去！(Regression to Axioms) 它的原始定义是什么？"
            ]
        },
        {
            id: "function",
            title: "2. 功能变通 (Functional Fixedness)",
            icon: <Sparkles className="w-4 h-4 text-orange-500" />,
            desc: "这个东西除了它该有的样子，还能是什么？",
            prompts: [
                "这个常数能不能看作是变量？(例如：把 1 看作 x^0)",
                "这个变量能不能看作是常数？(例如：对x求导时y是常数)",
                "这个几何图形能不能动起来？"
            ]
        },
        {
            id: "constraint",
            title: "3. 约束松绑 (Constraint Relaxation)",
            icon: <HelpCircle className="w-4 h-4 text-blue-500" />,
            desc: "你是不是自己给自己加了条条框框？",
            prompts: [
                "题目真的说了它是实数吗？也许是复数？矩阵？",
                "你是否默认了图形是规则的？(例如：默认三角形是直角)",
                "如果把条件去掉一个，结论还成立吗？"
            ]
        },
        {
            id: "analogy",
            title: "4. 类比迁移 (Analogy)",
            icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
            desc: "这道题长得像谁？",
            prompts: [
                "它像不像你做过的某道经典例题？",
                "它的结构(Structure)和什么定理解释得通？",
                "如果把问题简化(比如n=1, n=2)，规律是什么？"
            ]
        }
    ];

    return (
        <div className={cn("flex flex-col h-full bg-background border-l", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                    <span>顿悟时刻 (Eureka)</span>
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
                                换个视角看变量
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
                                                    <div className="text-muted-foreground">当前看法:</div>
                                                    <div className="font-medium">{role.currentRole}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">建议看作:</div>
                                                    <div className="font-medium text-orange-700 dark:text-orange-400">{role.suggestedRole}</div>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-orange-200 dark:border-orange-900">
                                                <div className="text-xs text-muted-foreground">💡 试试: </div>
                                                <code className="text-xs font-mono bg-background px-2 py-1 rounded mt-1 inline-block">
                                                    {role.transformation}
                                                </code>
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
                                    查看关键洞察
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
                                孵化期 (Incubation)
                            </h3>
                            {isTimerRunning && (
                                <Badge variant={timeLeft === 0 ? "destructive" : "secondary"} className="font-mono">
                                    {formatTime(timeLeft)}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            卡住超过 5 分钟？也许该停下来。让潜意识接管工作，先做下一题。
                        </p>

                        {!isTimerRunning ? (
                            <Button size="sm" variant="outline" className="w-full" onClick={startTimer}>
                                我卡住了 (开始计时)
                            </Button>
                        ) : timeLeft === 0 ? (
                            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded text-center font-medium animate-pulse">
                                ⏰ 时间到！请立即跳过此题！
                            </div>
                        ) : (
                            <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={stopTimer}>
                                取消计时
                            </Button>
                        )}
                    </div>

                    {/* 6. Fallback: Generic Heuristics (如果没有特定数据) */}
                    {!hasInteractiveContent && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">通用思维破局策略</h3>
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
