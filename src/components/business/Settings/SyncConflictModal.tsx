"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/lib/store";
import { Cloud, Laptop, Merge } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { DICT } from "@/lib/i18n";

export function SyncConflictModal() {
    const { pendingConflict, resolveConflict } = useProgressStore(
        useShallow(state => ({
            pendingConflict: state.pendingConflict,
            resolveConflict: state.resolveConflict
        }))
    );

    if (!pendingConflict) return null;

    const localDate = new Date(pendingConflict.local.timestamp).toLocaleString();
    const remoteDate = new Date(pendingConflict.remote.timestamp).toLocaleString();

    return (
        <Dialog open={!!pendingConflict} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{DICT.sync.conflict}</DialogTitle>
                    <DialogDescription>
                        {DICT.sync.conflictDesc}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 font-medium">
                            <Laptop className="w-4 h-4" /> {DICT.sync.localData}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {DICT.sync.localTime.replace("{time}", localDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {DICT.sync.localDesc}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-2 font-medium text-primary">
                            <Cloud className="w-4 h-4" /> {DICT.sync.remoteData}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {DICT.sync.remoteTime.replace("{time}", remoteDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {DICT.sync.remoteDesc}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => resolveConflict('local')}
                        className="w-full sm:w-auto"
                    >
                        <Laptop className="w-4 h-4 mr-2" />
                        {DICT.sync.useLocal}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => resolveConflict('remote')}
                        className="w-full sm:w-auto"
                    >
                        <Cloud className="w-4 h-4 mr-2" />
                        {DICT.sync.useRemote}
                    </Button>
                    <Button
                        onClick={() => resolveConflict('merge')}
                        className="w-full sm:w-auto"
                    >
                        <Merge className="w-4 h-4 mr-2" />
                        {DICT.sync.merge}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
