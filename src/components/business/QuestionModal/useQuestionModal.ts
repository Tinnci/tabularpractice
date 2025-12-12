/**
 * QuestionModal 的核心业务逻辑 Hook
 * 
 * 职责：
 * 1. 管理视图状态（visibleViews, isEditing, isFullscreen）
 * 2. 处理键盘快捷键
 * 3. 处理状态更新反馈
 * 4. 预加载图片
 * 5. 记录最后访问的题目
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { Status, ViewType, Question } from "@/lib/types";
import { useProgressStore } from "@/lib/store";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";

export interface UseQuestionModalProps {
    isOpen: boolean;
    question: Question | null;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
    onUpdateStatus: (id: string, status: Status) => void;
    onTimerToggle: () => void;
}

export function useQuestionModal({
    isOpen,
    question,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onClose,
    onUpdateStatus,
    onTimerToggle,
}: UseQuestionModalProps) {
    // ===== 视图状态 =====
    const [visibleViews, setVisibleViews] = useState<Set<ViewType>>(new Set(['question']));
    const [isEditing, setIsEditing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGitHubGuide, setShowGitHubGuide] = useState(false);

    // ===== Store =====
    const { stars, toggleStar, setLastQuestionId } = useProgressStore();

    // ===== 记录最后初始化的题目 ID =====
    const lastInitializedIdRef = useRef<string | null>(null);
    const questionId = question?.id;

    // ===== 重置视图状态（当题目切换时）=====
    useEffect(() => {
        if (isOpen && questionId && questionId !== lastInitializedIdRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVisibleViews(new Set(['question']));
            setLastQuestionId(questionId);
            lastInitializedIdRef.current = questionId;
        }
    }, [questionId, isOpen, setLastQuestionId]);

    // ===== 切换视图 =====
    const toggleView = useCallback((view: ViewType) => {
        setVisibleViews(prev => {
            const newSet = new Set(prev);
            if (newSet.has(view)) {
                newSet.delete(view);
            } else {
                newSet.add(view);
            }
            return newSet;
        });
    }, []);

    // ===== 状态更新处理（带 Toast 反馈）=====
    const handleStatusUpdate = useCallback((status: Status) => {
        if (!questionId) return;

        onUpdateStatus(questionId, status);

        const statusConfig = {
            mastered: {
                label: DICT.status.mastered,
                icon: '✓',
                className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
            },
            confused: {
                label: DICT.status.confused,
                icon: '?',
                className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300'
            },
            failed: {
                label: DICT.status.failed,
                icon: '✗',
                className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
            },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        if (config) {
            toast(`已标记为 ${config.label}`, {
                duration: 1500,
                position: 'bottom-center',
                className: config.className,
            });
        }
    }, [questionId, onUpdateStatus]);

    // ===== 键盘快捷键 =====
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case "ArrowLeft":
                if (hasPrev && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    onPrev();
                }
                break;
            case "ArrowRight":
                if (hasNext && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    onNext();
                }
                break;
            case "Escape":
                onClose();
                break;
            case "1":
                handleStatusUpdate('mastered');
                break;
            case "2":
                handleStatusUpdate('confused');
                break;
            case "3":
                handleStatusUpdate('failed');
                break;
            case " ":
                if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
                e.preventDefault();
                onTimerToggle();
                break;
        }
    }, [isOpen, hasPrev, hasNext, onPrev, onNext, onClose, handleStatusUpdate, onTimerToggle]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // ===== 预加载图片 =====
    useEffect(() => {
        if (!question) return;

        const { lowDataMode, repoBaseUrl, repoSources } = useProgressStore.getState();
        if (lowDataMode) return;

        const preload = (url?: string) => {
            if (!url) return;
            const finalUrl = getImageUrl(url, question, repoBaseUrl, repoSources);
            if (finalUrl) {
                const img = new Image();
                img.src = finalUrl;
            }
        };

        preload(question.answerImg);
        preload(question.analysisImg);
    }, [question]);

    // ===== 返回值 =====
    return {
        // 状态
        visibleViews,
        isEditing,
        isFullscreen,
        showGitHubGuide,
        isStarred: question ? !!stars[question.id] : false,

        // 操作
        toggleView,
        setIsEditing,
        setIsFullscreen,
        setShowGitHubGuide,
        toggleStar: () => questionId && toggleStar(questionId),
        handleStatusUpdate,
    };
}
