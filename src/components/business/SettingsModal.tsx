// This tool call is just a placeholder to switch to writing the DICT file.
// I need to update i18n.ts first.

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Settings, Download, Upload, Database, AlertTriangle, Github, RefreshCw, HelpCircle, FileText, Layers } from "lucide-react"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { Status, type BackupData } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { usePapers } from "@/hooks/usePapers"
import { usePaperGroups } from "@/hooks/useQuestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DICT } from "@/lib/i18n"

// NEW: PaperGroup-level filtering section
function PaperGroupFilterSection() {
    const { hiddenGroupIds, toggleGroupVisibility } = useProgressStore()
    const { paperGroups, isLoading } = usePaperGroups()

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{DICT.common.loading}</div>
    }

    if (!paperGroups || paperGroups.length === 0) {
        return <div className="text-sm text-muted-foreground">{DICT.wall.noPapers}</div>
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Layers className="h-4 w-4" />
                试卷组筛选
            </h3>
            <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-xs text-muted-foreground mb-3">
                    关闭的试卷组将不会出现在练习列表中。
                </div>
                <ScrollArea className="h-[120px] pr-3">
                    <div className="space-y-3">
                        {paperGroups.map(group => (
                            <div key={group.id} className="flex items-center justify-between">
                                <div className="space-y-0.5 overflow-hidden mr-2">
                                    <label className="text-sm font-medium leading-none truncate block" title={group.name}>
                                        {group.name}
                                    </label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">
                                            {group.type === 'unified' ? DICT.wall.unified : DICT.wall.selfProposed}
                                        </span>
                                    </div>
                                </div>
                                <Switch
                                    checked={!hiddenGroupIds.includes(group.id)}
                                    onCheckedChange={() => toggleGroupVisibility(group.id)}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

function PaperFilterSection() {
    const { hiddenPaperIds, togglePaperVisibility } = useProgressStore()
    const { papers, isLoading, mutate } = usePapers()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await mutate()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{DICT.common.loading}</div>
    }

    if (!papers || papers.length === 0) {
        return <div className="text-sm text-muted-foreground">{DICT.wall.noPapers}</div>
    }

    // Sort papers by year (descending)
    const sortedPapers = [...papers].sort((a, b) => b.year - a.year)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4" />
                    {DICT.settings.paperFilter}
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title={DICT.common.refresh}
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>
            <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-xs text-muted-foreground mb-3">
                    {DICT.settings.paperFilterDesc}
                </div>
                <ScrollArea className="h-[200px] pr-3">
                    <div className="space-y-3">
                        {sortedPapers.map(paper => (
                            <div key={paper.id} className="flex items-center justify-between">
                                <div className="space-y-0.5 overflow-hidden mr-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate block" title={paper.name}>
                                        {paper.name}
                                    </label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{paper.year}年</span>
                                        {paper.sourceUrl !== undefined && (
                                            <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] truncate max-w-[120px]" title={paper.sourceUrl || DICT.settings.local}>
                                                {paper.sourceUrl === '' ? DICT.settings.local : (paper.sourceUrl.includes('github') ? 'GitHub' : DICT.settings.remote)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Switch
                                    checked={!hiddenPaperIds.includes(paper.id)}
                                    onCheckedChange={() => togglePaperVisibility(paper.id)}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}


export function SettingsModal() {
    const [open, setOpen] = useState(false)
    const [importConfirmOpen, setImportConfirmOpen] = useState(false)
    const [pendingImportData, setPendingImportData] = useState<BackupData | Record<string, Status> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        importData,
        repoSources, addRepoSource, removeRepoSource, toggleRepoSource,
        githubToken, gistId, lastSyncedTime, syncStatus,
        setGithubToken, setGistId,
        syncData
    } = useProgressStore()

    const [newRepoName, setNewRepoName] = useState("")
    const [newRepoUrl, setNewRepoUrl] = useState("")
    const [isCheckingRepo, setIsCheckingRepo] = useState(false)

    // GitHub Sync Logic
    const handleSync = async () => {
        if (!githubToken) {
            toast.error("请先设置 GitHub Token");
            return;
        }

        try {
            await syncData();
            toast.success(DICT.settings.toast.syncSuccess);
        } catch (error) {
            console.error(error);
            toast.error(DICT.settings.toast.syncFailed, {
                description: DICT.settings.toast.syncFailedDesc
            });
        }
    };

    const handleCheckRepo = async () => {
        const url = newRepoUrl.trim().replace(/\/$/, "");
        const name = newRepoName.trim();

        if (!name || !url) {
            toast.error(DICT.settings.toast.nameUrlRequired);
            return;
        }

        setIsCheckingRepo(true);
        try {
            const res = await fetch(`${url}/index.json`);
            if (!res.ok) throw new Error("无法访问 index.json");

            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("index.json 格式错误");

            addRepoSource(name, url);
            setNewRepoName("");
            setNewRepoUrl("");

            toast.success(DICT.settings.toast.sourceAdded, {
                description: DICT.settings.toast.sourceAddedDesc
            });
        } catch (error) {
            console.error(error);
            toast.error(DICT.settings.toast.sourceVerifyFailed, {
                description: DICT.settings.toast.sourceVerifyFailedDesc
            });
        } finally {
            setIsCheckingRepo(false);
        }
    };

    // 导出功能
    const handleExport = async () => {
        try {
            const { default: JSZip } = await import('jszip');
            const { saveAs } = await import('file-saver');
            const { draftStore } = await import('@/lib/draftStore');

            const zip = new JSZip();
            const state = useProgressStore.getState();

            // 1. 添加核心数据
            const coreData = {
                version: 3,
                timestamp: new Date().toISOString(),
                progress: state.progress,
                notes: state.notes,
                stars: state.stars,
                repoSources: state.repoSources,
                progressLastModified: state.progressLastModified,
                notesLastModified: state.notesLastModified
            };
            zip.file("tabular-data.json", JSON.stringify(coreData, null, 2));

            // 2. 添加草稿数据
            const drafts = await draftStore.getAllDrafts();
            const draftsFolder = zip.folder("drafts");
            if (draftsFolder) {
                Object.entries(drafts).forEach(([id, content]) => {
                    draftsFolder.file(`${id}.json`, content);
                });
            }

            // 3. 生成并下载
            const content = await zip.generateAsync({ type: "blob" });
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            saveAs(content, `tabular-backup-${date}.zip`);

            toast.success(DICT.settings.toast.backupDownloaded, {
                description: DICT.settings.labels.backupDesc,
            });
        } catch (error) {
            console.error("Export failed:", error);
            toast.error(DICT.settings.toast.exportFailed, {
                description: DICT.settings.toast.exportFailedDesc,
            });
        }
    };

    // 触发文件选择
    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    // 处理文件选择
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            if (file.name.endsWith('.zip')) {
                // 处理 ZIP 完整备份
                const { default: JSZip } = await import('jszip');
                const zip = await JSZip.loadAsync(file);

                const dataFile = zip.file("tabular-data.json");
                if (!dataFile) throw new Error("无效的备份文件：缺少 tabular-data.json");

                const dataStr = await dataFile.async("string");
                const parsedData = JSON.parse(dataStr) as BackupData;

                // 预览草稿数量
                const draftsFolder = zip.folder("drafts");
                let draftCount = 0;
                if (draftsFolder) {
                    draftsFolder.forEach(() => { draftCount++; });
                }

                setPendingImportData({ ...parsedData, _draftCount: draftCount, _zip: zip });
                setImportConfirmOpen(true);

            } else if (file.name.endsWith('.json')) {
                // 处理旧版 JSON 备份
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target?.result as string;
                        const parsedData = JSON.parse(content);
                        setPendingImportData(parsedData);
                        setImportConfirmOpen(true);
                    } catch (e) {
                        console.error(e);
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

    // 确认导入
    const confirmImport = async () => {
        if (pendingImportData) {
            try {
                // 1. 恢复核心数据
                importData(pendingImportData);

                // 2. 如果是 ZIP 备份，恢复草稿 (检查 _zip 属性是否存在)
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
                                promises.push(
                                    file.async("string").then((content: string) => {
                                        const id = relativePath.replace('.json', '');
                                        draftsToRestore[id] = content;
                                    })
                                );
                            }
                        });

                        await Promise.all(promises);
                        await draftStore.importDrafts(draftsToRestore);
                    }
                }

                setImportConfirmOpen(false);
                setPendingImportData(null);
                setOpen(false);

                toast.success(DICT.settings.toast.importSuccess, {
                    description: DICT.settings.toast.importSuccessDesc,
                });

                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error("Restore failed:", error);
                toast.error(DICT.settings.toast.restoreFailed, { description: DICT.settings.toast.restoreFailedDesc });
            }
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4 mr-2" />
                        {DICT.settings.title}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle>{DICT.settings.title}</DialogTitle>
                        <DialogDescription>
                            {DICT.settings.desc}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
                        {/* 左栏：数据管理 + 题库源配置 */}
                        <div className="space-y-6">
                            {/* 数据管理区块 */}
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
                                        <TooltipContent>
                                            <p>{DICT.settings.exportSuccessDesc}</p>
                                        </TooltipContent>
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
                                        <TooltipContent>
                                            <p>{DICT.settings.labels.supportedFormats}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                        {DICT.settings.backupTip}
                                    </p>
                                </div>
                            </div>

                            {/* GitHub Sync 区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Github className="h-4 w-4" />
                                    {DICT.settings.sync}
                                </h3>

                                <div className="space-y-3 p-4 border rounded-lg bg-card/50">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">{DICT.settings.token}</label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px]">
                                                    <p>{DICT.settings.tokenTip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            type="password"
                                            value={githubToken || ""}
                                            onChange={(e) => setGithubToken(e.target.value)}
                                            placeholder="ghp_..."
                                            className="h-8 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">{DICT.settings.gistId}</label>
                                        <Input
                                            value={gistId || ""}
                                            onChange={(e) => setGistId(e.target.value)}
                                            placeholder={DICT.settings.gistIdPlaceholder}
                                            className="h-8 text-sm font-mono"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-muted-foreground">
                                            {lastSyncedTime ? DICT.settings.lastSync.replace('{time}', new Date(lastSyncedTime).toLocaleString()) : DICT.settings.neverSync}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleSync}
                                            disabled={syncStatus === 'syncing' || !githubToken}
                                            className="gap-2"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? "animate-spin" : ""}`} />
                                            {syncStatus === 'syncing' ? DICT.settings.syncing : DICT.settings.syncNow}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 题库源配置区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Database className="h-4 w-4" />
                                    {DICT.settings.repo}
                                </h3>

                                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                                    {DICT.settings.repoDesc}
                                </div>

                                {/* 已保存的源列表 */}
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">{DICT.settings.savedRepos}</div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {repoSources?.map(source => (
                                            <div key={source.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/30 transition-colors">
                                                <div className="flex-1 min-w-0 mr-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">{source.name}</span>
                                                        {source.isBuiltin && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{DICT.settings.builtin}</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate" title={source.url}>
                                                        {source.url || DICT.settings.labels.localDataDir}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={source.enabled}
                                                        onCheckedChange={(checked) => {
                                                            toggleRepoSource(source.id, checked);
                                                            toast.success(`${checked ? DICT.settings.toast.enabled : DICT.settings.toast.disabled}: ${source.name}`);
                                                            // 延迟刷新以重新加载数据
                                                            setTimeout(() => window.location.reload(), 800);
                                                        }}
                                                    />
                                                    {!source.isBuiltin && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                                                    onClick={() => removeRepoSource(source.id)}
                                                                >
                                                                    <span className="sr-only">{DICT.common.delete}</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-red-500">{DICT.common.delete}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 添加新源 */}
                                <div className="pt-2 border-t border-border space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">{DICT.settings.addRepo}</div>
                                    <div className="grid gap-2">
                                        <Input
                                            placeholder={DICT.settings.repoName}
                                            value={newRepoName}
                                            onChange={(e) => setNewRepoName(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder={DICT.settings.repoUrl}
                                                value={newRepoUrl}
                                                onChange={(e) => setNewRepoUrl(e.target.value)}
                                                className="flex-1 h-8 text-sm"
                                            />
                                            <Button
                                                onClick={handleCheckRepo}
                                                disabled={isCheckingRepo || !newRepoName || !newRepoUrl}
                                                size="sm"
                                                className="h-8"
                                            >
                                                {isCheckingRepo ? DICT.settings.validate : DICT.settings.add}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {DICT.settings.repoUrlTip}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 右栏：外观设置 + 试卷筛选 */}
                        <div className="space-y-6">
                            {/* 外观设置 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Settings className="h-4 w-4" />
                                    {DICT.settings.theme}
                                </h3>
                                <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-medium leading-none">
                                                {DICT.settings.appearance.compact}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {DICT.settings.appearance.compactDesc}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={useProgressStore.getState().appearance.compactMode}
                                            onCheckedChange={(checked) => useProgressStore.getState().setAppearance({ compactMode: checked })}
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2 border-t">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span>{DICT.settings.appearance.cardWidth}</span>
                                                <span className="text-muted-foreground">{useProgressStore.getState().appearance.cardWidth}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="140"
                                                max="300"
                                                step="10"
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                value={useProgressStore(state => state.appearance.cardWidth)}
                                                onChange={(e) => useProgressStore.getState().setAppearance({ cardWidth: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span>{DICT.settings.appearance.cardHeight}</span>
                                                <span className="text-muted-foreground">{useProgressStore.getState().appearance.cardHeight}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="48"
                                                max="120"
                                                step="4"
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                value={useProgressStore(state => state.appearance.cardHeight)}
                                                onChange={(e) => useProgressStore.getState().setAppearance({ cardHeight: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        {/* 列间距 */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span>{DICT.settings.appearance.colSpacing}</span>
                                                <span className="text-muted-foreground">{useProgressStore.getState().appearance.columnSpacing}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="48"
                                                step="4"
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                value={useProgressStore(state => state.appearance.columnSpacing)}
                                                onChange={(e) => useProgressStore.getState().setAppearance({ columnSpacing: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        {/* 行间距 (题目间距) */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span>{DICT.settings.appearance.rowSpacing}</span>
                                                <span className="text-muted-foreground">{useProgressStore.getState().appearance.rowSpacing}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="24"
                                                step="2"
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                value={useProgressStore(state => state.appearance.rowSpacing)}
                                                onChange={(e) => useProgressStore.getState().setAppearance({ rowSpacing: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 试卷组筛选 (PaperGroup-level) */}
                            <PaperGroupFilterSection />

                            {/* 试卷筛选 */}
                            <PaperFilterSection />
                        </div>
                    </div>
                    {/* 隐藏的文件输入框 */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </DialogContent>
            </Dialog>

            {/* 导入确认弹窗 */}
            <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            {DICT.settings.warningOverwrite}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                {DICT.settings.warningOverwriteDesc}
                            </p>
                            {pendingImportData && (
                                <div className="mt-4 p-3 bg-muted rounded text-xs font-mono text-muted-foreground space-y-1">
                                    <div>包含记录数: {'progress' in pendingImportData ? Object.keys(pendingImportData.progress || {}).length : Object.keys(pendingImportData).length}</div>

                                    {'notes' in pendingImportData && pendingImportData.notes && (
                                        <div>笔记: {Object.keys(pendingImportData.notes).length}</div>
                                    )}

                                    {'stars' in pendingImportData && pendingImportData.stars && (
                                        <div>收藏: {Object.keys(pendingImportData.stars).length}</div>
                                    )}

                                    {'repoSources' in pendingImportData && pendingImportData.repoSources && (
                                        <div>题库源: {pendingImportData.repoSources.length} (将合并)</div>
                                    )}

                                    {'_draftCount' in pendingImportData && typeof pendingImportData._draftCount === 'number' && pendingImportData._draftCount > 0 && (
                                        <div>手写草稿: {pendingImportData._draftCount} 份</div>
                                    )}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{DICT.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmImport}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {DICT.settings.confirmOverwrite}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
