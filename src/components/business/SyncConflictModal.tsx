import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/lib/store";
import { Cloud, Laptop, Merge } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

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
                    <DialogTitle>检测到数据冲突</DialogTitle>
                    <DialogDescription>
                        云端数据有更新的版本。这通常发生在其他设备进行了同步后。请选择如何解决此冲突。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 font-medium">
                            <Laptop className="w-4 h-4" /> 本地数据
                        </div>
                        <div className="text-sm text-muted-foreground">
                            时间: {localDate}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            包含您当前设备上所有未同步的更改。
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-2 font-medium text-primary">
                            <Cloud className="w-4 h-4" /> 云端数据
                        </div>
                        <div className="text-sm text-muted-foreground">
                            时间: {remoteDate}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            来自其他设备的最新同步数据。
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
                        使用本地 (覆盖)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => resolveConflict('remote')}
                        className="w-full sm:w-auto"
                    >
                        <Cloud className="w-4 h-4 mr-2" />
                        使用云端 (丢失本地)
                    </Button>
                    <Button
                        onClick={() => resolveConflict('merge')}
                        className="w-full sm:w-auto"
                    >
                        <Merge className="w-4 h-4 mr-2" />
                        智能合并 (推荐)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
