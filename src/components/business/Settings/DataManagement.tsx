"use client";

import { Button } from "@/components/ui/button"
import { Database, Download, Upload, AlertTriangle } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { BackupData, Status } from "@/lib/types"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DataManagement() {
    const { importData, progress, notes, stars, repoSources, progressLastModified, notesLastModified } = useProgressStore()
    const [importConfirmOpen, setImportConfirmOpen] = useState(false)
    const [pendingImportData, setPendingImportData] = useState<BackupData | Record<string, Status> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Export Functionality
    const handleExport = async () => {
        try {
            const { default: JSZip } = await import('jszip');
            const { saveAs } = await import('file-saver');
            const { draftStore } = await import('@/lib/draftStore');

            const zip = new JSZip();

            // 1. Core Data
            const coreData = {
                version: 3,
                timestamp: new Date().toISOString(),
                progress, notes, stars, repoSources, progressLastModified, notesLastModified
            };
            zip.file("tabular-data.json", JSON.stringify(coreData, null, 2));

            // 2. Drafts
            const drafts = await draftStore.getAllDrafts();
            const draftsFolder = zip.folder("drafts");
            if (draftsFolder) {
                Object.entries(drafts).forEach(([id, content]) => {
                    draftsFolder.file(`${id}.json`, content);
                });
            }

            // 3. Generate & Download
            const content = await zip.generateAsync({ type: "blob" });
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            saveAs(content, `tabular-backup-${date}.zip`);

            toast.success(DICT.settings.toast.backupDownloaded, { description: DICT.settings.labels.backupDesc });
        } catch (error) {
            console.error("Export failed:", error);
            toast.error(DICT.settings.toast.exportFailed, { description: DICT.settings.toast.exportFailedDesc });
        }
    };

    // Import Trigger
    const triggerImport = () => fileInputRef.current?.click();

    // File Handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            if (file.name.endsWith('.zip')) {
                const { default: JSZip } = await import('jszip');
                const zip = await JSZip.loadAsync(file);

                const dataFile = zip.file("tabular-data.json");
                if (!dataFile) throw new Error("无效的备份文件：缺少 tabular-data.json");

                const dataStr = await dataFile.async("string");
                const parsedData = JSON.parse(dataStr) as BackupData;

                const draftsFolder = zip.folder("drafts");
                let draftCount = 0;
                if (draftsFolder) draftsFolder.forEach(() => { draftCount++; });

                setPendingImportData({ ...parsedData, _draftCount: draftCount, _zip: zip });
                setImportConfirmOpen(true);

            } else if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target?.result as string;
                        setPendingImportData(JSON.parse(content));
                        setImportConfirmOpen(true);
                    } catch {
                        toast.error(DICT.settings.toast.parseFailed, { description: DICT.settings.toast.parseFailedDesc });
                    }
                };
                reader.readAsText(file);
            } else {
                toast.error(DICT.settings.toast.unsupportedFormat, { description: DICT.settings.toast.unsupportedFormatDesc });
            }
        } catch (error) {
            console.error("Import failed:", error);
            toast.error(DICT.settings.toast.readFailed, { description: DICT.settings.toast.readFailedDesc });
        }
    };

    // Confirm Import
    const confirmImport = async () => {
        if (pendingImportData) {
            try {
                importData(pendingImportData);

                if ('_zip' in pendingImportData && pendingImportData._zip) {
                    const { draftStore } = await import('@/lib/draftStore');
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const zip = pendingImportData._zip as any;
                    const draftsFolder = zip.folder("drafts");

                    if (draftsFolder) {
                        const draftsToRestore: Record<string, string> = {};
                        const promises: Promise<void>[] = [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        draftsFolder.forEach((relativePath: string, file: any) => {
                            if (!file.dir) {
                                promises.push(file.async("string").then((content: string) => {
                                    draftsToRestore[relativePath.replace('.json', '')] = content;
                                }));
                            }
                        });
                        await Promise.all(promises);
                        await draftStore.importDrafts(draftsToRestore);
                    }
                }

                setImportConfirmOpen(false);
                setPendingImportData(null);
                toast.success(DICT.settings.toast.importSuccess, { description: DICT.settings.toast.importSuccessDesc });
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error("Restore failed:", error);
                toast.error(DICT.settings.toast.restoreFailed, { description: DICT.settings.toast.restoreFailedDesc });
            }
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Database className="h-4 w-4" />
                {DICT.settings.data}
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex flex-col h-24 gap-2 border-border hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            onClick={handleExport}
                        >
                            <Download className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium">{DICT.settings.backupFull}</span>
                            <span className="text-xs text-muted-foreground font-normal">{DICT.settings.backupFullDesc}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{DICT.settings.exportSuccessDesc}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex flex-col h-24 gap-2 border-border hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            onClick={triggerImport}
                        >
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium">{DICT.settings.restore}</span>
                            <span className="text-xs text-muted-foreground font-normal">{DICT.settings.restoreDesc}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{DICT.settings.labels.supportedFormats}</p></TooltipContent>
                </Tooltip>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    {DICT.settings.backupTip}
                </p>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.zip" onChange={handleFileChange} />

            <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            {DICT.settings.warningOverwrite}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>{DICT.settings.warningOverwriteDesc}</p>
                            {pendingImportData && (
                                <div className="mt-4 p-3 bg-muted rounded text-xs font-mono text-muted-foreground space-y-1">
                                    <div>记录数: {'progress' in pendingImportData ? Object.keys(pendingImportData.progress || {}).length : Object.keys(pendingImportData).length}</div>
                                    {'repoSources' in pendingImportData && pendingImportData.repoSources && (
                                        <div>题库源: {pendingImportData.repoSources.length}</div>
                                    )}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{DICT.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmImport} className="bg-red-600 hover:bg-red-700">
                            {DICT.settings.confirmOverwrite}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
