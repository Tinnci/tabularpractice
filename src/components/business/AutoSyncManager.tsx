"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/lib/store";

export function AutoSyncManager() {
    const triggerAutoSync = useProgressStore(state => state.triggerAutoSync);

    // Subscribe to changes in data that should trigger sync
    const progress = useProgressStore(state => state.progress);
    const notes = useProgressStore(state => state.notes);
    const times = useProgressStore(state => state.times);
    const stars = useProgressStore(state => state.stars);

    useEffect(() => {
        triggerAutoSync();
    }, [progress, notes, times, stars, triggerAutoSync]);

    return null;
}
