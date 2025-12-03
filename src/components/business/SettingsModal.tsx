"use client"

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
import { Settings, Download, Upload, Database, AlertTriangle, Github, RefreshCw, HelpCircle } from "lucide-react"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { Status, type RepoSource } from "@/lib/types"

import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function SettingsModal() {
    const [open, setOpen] = useState(false)
    const [importConfirmOpen, setImportConfirmOpen] = useState(false)
    const [pendingImportData, setPendingImportData] = useState<{
        progress: Record<string, Status>;
        notes?: Record<string, string>;
        stars?: Record<string, boolean>;
        repoSources?: RepoSource[];
    } | Record<string, Status> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        progress, notes, importData,
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
            toast.success("同步成功");
        } catch (error) {
            console.error(error);
            toast.error("同步失败", {
                description: "请检查网络或 Token 权限"
            });
        }
    };

    const handleCheckRepo = async () => {
        const url = newRepoUrl.trim().replace(/\/$/, "");
        const name = newRepoName.trim();

        if (!name || !url) {
            toast.error("请填写名称和 URL");
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

            toast.success("题库源添加成功", {
                description: "您可以点击开关启用该题库"
            });
        } catch (error) {
            console.error(error);
            toast.error("题库验证失败", {
                description: "请检查 URL 是否正确，并确保 index.json 可访问"
            });
        } finally {
            setIsCheckingRepo(false);
        }
    };

    // 导出功能
    const handleExport = () => {
        try {
            const exportData = {
                version: 2, // 升级版本号
                timestamp: new Date().toISOString(),
                progress,
                notes,
                stars: useProgressStore.getState().stars,
                repoSources: useProgressStore.getState().repoSources
            };

            const dataStr = JSON.stringify(exportData, null, 2)
            const blob = new Blob([dataStr], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            const date = new Date()
            const timestamp = date.toISOString().split('T')[0].replace(/-/g, '')
            const filename = `tabular-practice-backup-${timestamp}.json`

            const link = document.createElement("a")
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success("备份文件已下载", {
                description: `包含进度、笔记、收藏和题库源配置`,
            })
        } catch (error) {
            console.error("Export failed:", error)
            toast.error("导出失败", {
                description: "生成备份文件时出现错误",
            })
        }
    }

    // 触发文件选择
    const triggerImport = () => {
        fileInputRef.current?.click()
    }

    // 处理文件选择
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        e.target.value = ''

        if (!file.name.endsWith('.json')) {
            toast.error("文件格式错误", {
                description: "请上传 .json 格式的备份文件",
            })
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string
                const parsedData = JSON.parse(content)

                if (typeof parsedData !== 'object' || parsedData === null) {
                    throw new Error("Invalid JSON structure")
                }

                let isValid = false;
                if ('progress' in parsedData) {
                    const progressKeys = Object.keys(parsedData.progress || {});
                    if (progressKeys.length > 0) isValid = true;
                } else {
                    const keys = Object.keys(parsedData);
                    if (keys.length > 0) isValid = true;
                }

                if (!isValid) {
                    toast.warning("文件为空或不包含进度数据")
                    return
                }

                setPendingImportData(parsedData)
                setImportConfirmOpen(true)

            } catch (error) {
                console.error("Import parsing failed:", error)
                toast.error("解析失败", {
                    description: "备份文件内容损坏或格式不正确",
                })
            }
        }
        reader.readAsText(file)
    }

    // 确认导入
    const confirmImport = () => {
        if (pendingImportData) {
            importData(pendingImportData)
            setImportConfirmOpen(false)
            setPendingImportData(null)
            setOpen(false)

            toast.success("导入成功", {
                description: "刷题进度已恢复，页面即将刷新...",
            })

            setTimeout(() => {
                window.location.reload()
            }, 1500)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4 mr-2" />
                        设置
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle>设置</DialogTitle>
                        <DialogDescription>
                            管理您的应用偏好和数据。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
                        {/* 左栏：数据管理 + 题库源配置 */}
                        <div className="space-y-6">
                            {/* 数据管理区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Database className="h-4 w-4" />
                                    数据管理
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
                                                <span className="text-sm font-medium">导出进度</span>
                                                <span className="text-xs text-muted-foreground font-normal">备份到本地 JSON</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>导出为 .json 格式</p>
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
                                                <span className="text-sm font-medium">导入进度</span>
                                                <span className="text-xs text-muted-foreground font-normal">恢复备份文件</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>支持 .json 格式备份文件</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                        提示：数据存储在浏览器的 LocalStorage 中。为了防止数据丢失（如清理缓存），建议定期导出备份。
                                    </p>
                                </div>
                            </div>

                            {/* GitHub Sync 区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Github className="h-4 w-4" />
                                    GitHub 云同步
                                </h3>

                                <div className="space-y-3 p-4 border rounded-lg bg-card/50">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">GitHub Token</label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>需要具有 Gist 权限的 Personal Access Token</p>
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
                                        <label className="text-xs font-medium text-muted-foreground">Gist ID (留空则自动创建)</label>
                                        <Input
                                            value={gistId || ""}
                                            onChange={(e) => setGistId(e.target.value)}
                                            placeholder="自动生成..."
                                            className="h-8 text-sm font-mono"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-muted-foreground">
                                            {lastSyncedTime ? `上次同步: ${new Date(lastSyncedTime).toLocaleString()}` : "从未同步"}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleSync}
                                            disabled={syncStatus === 'syncing' || !githubToken}
                                            className="gap-2"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? "animate-spin" : ""}`} />
                                            {syncStatus === 'syncing' ? "同步中..." : "立即同步"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 题库源配置区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Database className="h-4 w-4" />
                                    题库源配置
                                </h3>

                                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                                    您可以同时启用多个题库源，系统将自动合并所有题目。
                                </div>

                                {/* 已保存的源列表 */}
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">已保存的源</div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {repoSources?.map(source => (
                                            <div key={source.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/30 transition-colors">
                                                <div className="flex-1 min-w-0 mr-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">{source.name}</span>
                                                        {source.isBuiltin && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">内置</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate" title={source.url}>
                                                        {source.url || "本地数据目录"}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={source.enabled}
                                                        onCheckedChange={(checked) => {
                                                            toggleRepoSource(source.id, checked);
                                                            toast.success(`${checked ? '启用' : '禁用'}: ${source.name}`);
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
                                                                    <span className="sr-only">删除</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-red-500">删除此题库源</p>
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
                                    <div className="text-xs font-medium text-muted-foreground">添加新源</div>
                                    <div className="grid gap-2">
                                        <Input
                                            placeholder="名称 (例如: 数学一真题)"
                                            value={newRepoName}
                                            onChange={(e) => setNewRepoName(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="URL (GitHub Raw 或 API)"
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
                                                {isCheckingRepo ? "验证..." : "添加"}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        提示: URL 应指向包含 index.json 的目录
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 右栏：偏好设置 */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                <Settings className="h-4 w-4" />
                                偏好设置
                            </h3>

                            {/* 省流量模式 */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        省流量模式
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        开启后将关闭图片的自动预加载功能，仅在查看时加载。
                                    </p>
                                </div>
                                <Switch
                                    checked={useProgressStore(state => state.lowDataMode)}
                                    onCheckedChange={(checked) => useProgressStore.getState().setLowDataMode(checked)}
                                />
                            </div>

                            {/* 外观设置 */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">外观调整</h4>

                                {/* 卡片宽度 */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span>卡片宽度</span>
                                        <span className="text-muted-foreground">{useProgressStore.getState().appearance.cardWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="100"
                                        max="300"
                                        step="4"
                                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        value={useProgressStore(state => state.appearance.cardWidth)}
                                        onChange={(e) => useProgressStore.getState().setAppearance({ cardWidth: parseInt(e.target.value) })}
                                    />
                                </div>

                                {/* 卡片高度 */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span>卡片高度</span>
                                        <span className="text-muted-foreground">{useProgressStore.getState().appearance.cardHeight}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="40"
                                        max="120"
                                        step="4"
                                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        value={useProgressStore(state => state.appearance.cardHeight)}
                                        onChange={(e) => useProgressStore.getState().setAppearance({ cardHeight: parseInt(e.target.value) })}
                                        disabled={useProgressStore(state => state.appearance.heightMode) === 'auto'}
                                    />
                                </div>

                                {/* 高度模式切换 */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <div className="space-y-0.5">
                                        <label className="text-xs font-medium leading-none">
                                            自适应高度
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            根据图片内容调整卡片高度
                                        </p>
                                    </div>
                                    <Switch
                                        checked={useProgressStore(state => state.appearance.heightMode) === 'auto'}
                                        onCheckedChange={(checked) => useProgressStore.getState().setAppearance({ heightMode: checked ? 'auto' : 'fixed' })}
                                    />
                                </div>

                                {/* 紧凑模式切换 */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="text-xs font-medium leading-none">
                                            紧凑模式
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            完全去除卡片内边距（仅自适应模式）
                                        </p>
                                    </div>
                                    <Switch
                                        checked={useProgressStore(state => state.appearance.compactMode)}
                                        onCheckedChange={(checked) => useProgressStore.getState().setAppearance({ compactMode: checked })}
                                        disabled={useProgressStore(state => state.appearance.heightMode) !== 'auto'}
                                    />
                                </div>

                                {/* 列间距 (年份间距) */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span>年份间距</span>
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
                                        <span>题目间距</span>
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
                            警告：即将覆盖数据
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                此操作将使用导入文件中的数据<span className="font-bold text-foreground">完全覆盖</span>您当前的刷题进度。
                            </p>
                            <p>
                                当前进度将被永久删除且无法撤销。
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
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmImport}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            确认覆盖
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
