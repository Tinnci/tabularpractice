"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';

export function AutoSyncManager() {
    const triggerAutoSync = useProgressStore(state => state.triggerAutoSync);

    // Use shallow comparison to avoid unnecessary re-renders
    const { progress, notes, times, stars } = useProgressStore(
        useShallow(state => ({
            progress: state.progress,
            notes: state.notes,
            times: state.times,
            stars: state.stars
        }))
    );

    useEffect(() => {
        triggerAutoSync();
    }, [progress, notes, times, stars, triggerAutoSync]);

    return null;
}
