"use client"

import { useState, useRef, useEffect } from "react"
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
import { Settings, Download, Upload, Database, AlertTriangle } from "lucide-react"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { Status } from "@/lib/types"

import { Switch } from "@/components/ui/switch"

export function SettingsModal() {
    const [open, setOpen] = useState(false)
    const [importConfirmOpen, setImportConfirmOpen] = useState(false)
    // 更新类型定义以支持新旧两种格式
    const [pendingImportData, setPendingImportData] = useState<{ progress: Record<string, Status>; notes?: Record<string, string> } | Record<string, Status> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { progress, notes, importData, repoBaseUrl, setRepoBaseUrl, repoSources, addRepoSource, removeRepoSource } = useProgressStore()

    const [newRepoName, setNewRepoName] = useState("")
    const [newRepoUrl, setNewRepoUrl] = useState("")
    const [isCheckingRepo, setIsCheckingRepo] = useState(false)

    // 验证并添加新题库源
    const handleAddSource = async () => {
        const name = newRepoName.trim();
        const url = newRepoUrl.trim();

        if (!name || !url) {
            toast.error("请填写名称和 URL");
            return;
        }

        setIsCheckingRepo(true);
        try {
            // 尝试请求 index.json 验证有效性
            const res = await fetch(`${url}/index.json`);
            if (!res.ok) throw new Error("无法访问 index.json");

            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("index.json 格式错误");

            addRepoSource(name, url);
            setNewRepoName("");
            setNewRepoUrl("");

            toast.success("题库源添加成功", {
                description: "您可以点击'使用'按钮切换到该题库"
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
            // 导出包含进度和笔记的完整数据
            const exportData = {
                version: 1,
                timestamp: new Date().toISOString(),
                progress,
                notes
            };

            const dataStr = JSON.stringify(exportData, null, 2)
            const blob = new Blob([dataStr], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            // 生成带时间戳的文件名
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
                description: `文件名为 ${filename}`,
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

        // 重置 input value，允许重复选择同一个文件
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

                // 兼容性处理：检查是否是新版格式
                let isValid = false;

                if ('progress' in parsedData) {
                    // 新版格式
                    const progressKeys = Object.keys(parsedData.progress || {});
                    if (progressKeys.length > 0) {
                        isValid = true;
                    }
                } else {
                    // 旧版格式 (直接是 progress 对象)
                    const keys = Object.keys(parsedData);
                    // 简单的启发式检查：key 看起来像 ID，value 是 Status
                    if (keys.length > 0) {
                        isValid = true;
                    }
                }

                if (!isValid) {
                    toast.warning("文件为空或不包含进度数据")
                    return
                }

                // 暂存数据并打开确认框
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
            setOpen(false) // 关闭设置弹窗

            toast.success("导入成功", {
                description: "刷题进度已恢复，页面即将刷新...",
            })

            // 延迟刷新页面以确保状态更新
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
                                    {/* 导出按钮 */}
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-24 gap-2 border-border hover:bg-muted/50 hover:border-border transition-all"
                                        onClick={handleExport}
                                    >
                                        <Download className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-sm font-medium">导出进度</span>
                                        <span className="text-xs text-muted-foreground font-normal">备份到本地 JSON</span>
                                    </Button>

                                    {/* 导入按钮 */}
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-24 gap-2 border-border hover:bg-muted/50 hover:border-border transition-all"
                                        onClick={triggerImport}
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-sm font-medium">导入进度</span>
                                        <span className="text-xs text-muted-foreground font-normal">恢复备份文件</span>
                                    </Button>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                        提示：数据存储在浏览器的 LocalStorage 中。为了防止数据丢失（如清理缓存），建议定期导出备份。
                                    </p>
                                </div>
                            </div>

                            {/* 题库源配置区块 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Database className="h-4 w-4" />
                                    题库源配置
                                </h3>

                                {/* 当前使用的源 */}
                                <div className="p-3 bg-muted/50 rounded-md border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">当前使用:</div>
                                    <div className="text-sm font-medium truncate" title={repoBaseUrl || "内置默认题库"}>
                                        {repoBaseUrl ? (
                                            repoSources?.find(s => s.url === repoBaseUrl)?.name || repoBaseUrl
                                        ) : (
                                            "内置默认题库"
                                        )}
                                    </div>
                                    {repoBaseUrl && (
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary mt-1"
                                            onClick={() => {
                                                setRepoBaseUrl('');
                                                toast.success("已恢复默认题库");
                                                setTimeout(() => window.location.reload(), 500);
                                            }}
                                        >
                                            恢复默认
                                        </Button>
                                    )}
                                </div>

                                {/* 已保存的源列表 */}
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground">已保存的源</div>
                                    {repoSources?.length > 0 ? (
                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                            {repoSources.map(source => (
                                                <div key={source.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors group">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <div className="text-sm font-medium truncate">{source.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate" title={source.url}>{source.url}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="sm"
                                                            variant={repoBaseUrl === source.url ? "secondary" : "ghost"}
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => {
                                                                if (repoBaseUrl !== source.url) {
                                                                    setRepoBaseUrl(source.url);
                                                                    toast.success(`已切换到: ${source.name}`);
                                                                    setTimeout(() => window.location.reload(), 500);
                                                                }
                                                            }}
                                                            disabled={repoBaseUrl === source.url}
                                                        >
                                                            {repoBaseUrl === source.url ? "使用中" : "使用"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                                            onClick={() => removeRepoSource(source.id)}
                                                        >
                                                            <span className="sr-only">删除</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground text-center py-2">暂无保存的题库源</div>
                                    )}
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
                                                onClick={handleAddSource}
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
            < AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen} >
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
                                <div className="mt-4 p-3 bg-muted rounded text-xs font-mono text-muted-foreground">
                                    包含记录数: {'progress' in pendingImportData ? Object.keys(pendingImportData.progress || {}).length : Object.keys(pendingImportData).length}
                                    {'notes' in pendingImportData && pendingImportData.notes && (
                                        <span className="ml-2">
                                            (笔记: {Object.keys(pendingImportData.notes).length})
                                        </span>
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
            </AlertDialog >
        </>
    )
}
