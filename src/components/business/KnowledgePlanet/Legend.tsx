import React from 'react';
import { DICT } from '@/lib/i18n';

export const Legend = () => {
    return (
        <div className="absolute bottom-4 right-4 p-3 bg-background/40 backdrop-blur-md rounded-lg border border-border/20 text-xs text-muted-foreground space-y-2 select-none z-10">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                <span>{DICT.planet.critical}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]"></span>
                <span>{DICT.dashboard.confusedLabel}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 opacity-80"></span>
                <span>{DICT.planet.mastered}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/80 border border-primary/20"></span>
                <span>{DICT.onboarding.features.tracking}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                <span className="w-4 h-4 border border-dashed border-gray-400 rounded-full flex items-center justify-center text-[8px]">T</span>
                <span>{DICT.planet.sizeByCount}</span>
            </div>
        </div>
    );
};

