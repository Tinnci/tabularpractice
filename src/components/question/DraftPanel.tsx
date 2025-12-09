"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DICT } from "@/lib/i18n";
import { PenLine, Pencil, Eraser, Undo, Trash2 } from "lucide-react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "@/components/ui/sketch-canvas";
import type { ExportedPath } from "@/components/ui/sketch-canvas/types";
import { GpuSketchCanvas } from "@/components/ui/sketch-canvas/gpu";
import { useTheme } from "next-themes";

interface DraftPanelProps {
    questionId: string;
    isVisible: boolean;
}

export function DraftPanel({ questionId, isVisible }: DraftPanelProps) {
    const { theme } = useTheme();
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeColor, setStrokeColor] = useState("#000000");
    const [strokeWidth] = useState(4);
    const [eraserMode, setEraserMode] = useState(false);
    const [onlyPenMode, setOnlyPenMode] = useState(false);
    const [useGpu, setUseGpu] = useState(false);

    // 监听主题变化,自动调整笔刷颜色
    const updateColorForTheme = useCallback(() => {
        setStrokeColor(prevColor => {
            if (theme === 'dark' && prevColor === "#000000") return "#FFFFFF";
            if (theme !== 'dark' && prevColor === "#FFFFFF") return "#000000";
            return prevColor;
        });
    }, [theme]);

    useEffect(() => {
        updateColorForTheme();
    }, [updateColorForTheme]);

    // 加载草稿
    useEffect(() => {
        if (!isVisible || !questionId) return;

        const loadDraft = async () => {
            if (!canvasRef.current) return;

            // 重置画布
            canvasRef.current.clearCanvas();

            try {
                const { draftStore } = await import('@/lib/draftStore');
                const savedDraft = await draftStore.getDraft(questionId);

                if (savedDraft) {
                    const paths = JSON.parse(savedDraft) as ExportedPath[];
                    // 颜色自适应转换逻辑
                    const transformedPaths = paths.map((path) => ({
                        ...path,
                        strokeColor:
                            (path.strokeColor === "#000000" && theme === 'dark') ? "#FFFFFF" :
                                (path.strokeColor === "#FFFFFF" && theme !== 'dark') ? "#000000" :
                                    path.strokeColor
                    }));
                    canvasRef.current.loadPaths(transformedPaths);
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        };

        loadDraft();
    }, [questionId, isVisible, theme]); // theme 变化时也可以考虑重新转换颜色，但通常 clearCanvas 会清空，这里主要依赖初始加载

    // 保存草稿
    const saveDraft = useCallback(async () => {
        if (questionId && canvasRef.current) {
            try {
                const paths = await canvasRef.current.exportPaths();
                const { draftStore } = await import('@/lib/draftStore');

                if (paths.length > 0) {
                    await draftStore.saveDraft(questionId, JSON.stringify(paths));
                } else {
                    await draftStore.deleteDraft(questionId);
                }
            } catch (e) {
                console.error("Failed to save draft", e);
            }
        }
    }, [questionId]);

    // 防抖保存
    const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSaveDraft = useCallback(() => {
        if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
        saveDraftTimeoutRef.current = setTimeout(saveDraft, 500);
    }, [saveDraft]);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="bg-card rounded-xl border border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="bg-purple-50/50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-900 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium text-purple-700 dark:text-purple-400">
                <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> {DICT.exam.handwritingDraft}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={!eraserMode ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                    onClick={() => {
                                        setEraserMode(false);
                                        canvasRef.current?.eraseMode(false);
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{DICT.exam.pen}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={eraserMode ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                    onClick={() => {
                                        setEraserMode(true);
                                        canvasRef.current?.eraseMode(true);
                                    }}
                                >
                                    <Eraser className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{DICT.exam.eraser}</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={onlyPenMode ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                    onClick={() => setOnlyPenMode(!onlyPenMode)}
                                >
                                    <PenLine className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{onlyPenMode ? DICT.exam.palmRejectionOn : DICT.exam.palmRejectionOff}</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                    onClick={() => {
                                        canvasRef.current?.undo();
                                        setTimeout(saveDraft, 100);
                                    }}
                                >
                                    <Undo className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{DICT.common.undo}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90 hover:scale-105"
                                    onClick={() => {
                                        if (confirm(DICT.exam.clearDraftConfirm)) {
                                            canvasRef.current?.clearCanvas();
                                            setTimeout(saveDraft, 100);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{DICT.exam.clearDraft}</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={useGpu ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-9 px-2 text-xs font-bold transition-all active:scale-90 hover:scale-105 hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                                    onClick={() => setUseGpu(!useGpu)}
                                >
                                    GPU
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{useGpu ? DICT.exam.gpuOn : DICT.exam.gpuOff}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="flex-1 relative bg-white dark:bg-zinc-900 cursor-crosshair touch-none">
                {useGpu ? (
                    <GpuSketchCanvas
                        ref={canvasRef}
                        strokeWidth={strokeWidth}
                        strokeColor={strokeColor}
                        canvasColor="transparent"
                        className="w-full h-full"
                        onStroke={debouncedSaveDraft}
                        allowOnlyPointerType={onlyPenMode ? 'pen' : 'all'}
                    />
                ) : (
                    <ReactSketchCanvas
                        ref={canvasRef}
                        strokeWidth={strokeWidth}
                        strokeColor={strokeColor}
                        canvasColor="transparent"
                        className="w-full h-full"
                        onStroke={debouncedSaveDraft}
                        allowOnlyPointerType={onlyPenMode ? 'pen' : 'all'}
                    />
                )}
            </div>
        </div>
    );
}
