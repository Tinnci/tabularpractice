import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
    MonitorPlay,
    Eye,
    FileText,
    PenLine,
    Pencil,
    Maximize2,
    Minimize2
} from "lucide-react";
import { DICT } from "@/lib/i18n";
import { ViewType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuestionToolbarProps {
    visibleViews: Set<ViewType>;
    onToggleView: (view: ViewType) => void;
    videoUrl?: string;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    className?: string;
}

export function QuestionToolbar({
    visibleViews,
    onToggleView,
    videoUrl,
    isFullscreen,
    onToggleFullscreen,
    className
}: QuestionToolbarProps) {
    return (
        <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {videoUrl && (
                    <Toggle
                        size="sm"
                        pressed={visibleViews.has('video')}
                        onPressedChange={() => onToggleView('video')}
                        className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                        aria-label="Toggle video"
                    >
                        <MonitorPlay className="h-4 w-4 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                            {DICT.exam.video}
                        </span>
                    </Toggle>
                )}
                <Toggle
                    size="sm"
                    pressed={visibleViews.has('answer')}
                    onPressedChange={() => onToggleView('answer')}
                    className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                    aria-label="Toggle answer"
                >
                    <Eye className="h-4 w-4 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                        {DICT.exam.answer}
                    </span>
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={visibleViews.has('analysis')}
                    onPressedChange={() => onToggleView('analysis')}
                    className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                    aria-label="Toggle analysis"
                >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                        {DICT.exam.analysis}
                    </span>
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={visibleViews.has('note')}
                    onPressedChange={() => onToggleView('note')}
                    className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                    aria-label="Toggle note"
                >
                    <PenLine className="h-4 w-4 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                        {DICT.exam.note}
                    </span>
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={visibleViews.has('draft')}
                    onPressedChange={() => onToggleView('draft')}
                    className="group h-8 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm shrink-0 transition-all duration-300 ease-in-out"
                    aria-label="Toggle draft"
                >
                    <Pencil className="h-4 w-4 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-[3rem] group-hover:opacity-100 group-hover:ml-1.5 data-[state=on]:max-w-[3rem] data-[state=on]:opacity-100 data-[state=on]:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs">
                        {DICT.exam.draft}
                    </span>
                </Toggle>
            </div>

            {/* 全屏切换按钮 */}
            <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                onClick={onToggleFullscreen}
                title={isFullscreen ? DICT.common.exitFullscreen : DICT.common.enterFullscreen}
            >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
        </div>
    );
}
