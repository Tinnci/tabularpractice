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
import { Settings, Download, Upload, Database, AlertTriangle } from "lucide-react"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { Status } from "@/lib/types"

export function SettingsModal() {
    const [open, setOpen] = useState(false)
    const [importConfirmOpen, setImportConfirmOpen] = useState(false)
    // 更新类型定义以支持新旧两种格式
    const [pendingImportData, setPendingImportData] = useState<{ progress: Record<string, Status>; notes?: Record<string, string> } | Record<string, Status> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { progress, notes, importData, repoBaseUrl, setRepoBaseUrl } = useProgressStore()

    const [repoUrlInput, setRepoUrlInput] = useState(repoBaseUrl)
    const [isCheckingRepo, setIsCheckingRepo] = useState(false)

    // 验证并保存题库地址
    const handleSaveRepoUrl = async () => {
        const url = repoUrlInput.trim();

        if (!url) {
            setRepoBaseUrl('');
            toast.success("已恢复默认题库");
            return;
        }

        setIsCheckingRepo(true);
        try {
            // 尝试请求 index.json 验证有效性
            const res = await fetch(`${url}/index.json`);
            if (!res.ok) throw new Error("无法访问 index.json");

            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("index.json 格式错误");

            setRepoBaseUrl(url);
            toast.success("题库源配置成功", {
                description: "已切换到自定义数据源"
            });

            // 延迟刷新以重新加载数据
            setTimeout(() => window.location.reload(), 1000);
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
                let recordCount = 0;

                if ('progress' in parsedData) {
                    // 新版格式
                    const progressKeys = Object.keys(parsedData.progress || {});
                    if (progressKeys.length > 0) {
                        isValid = true;
                        recordCount = progressKeys.length;
                    }
                } else {
                    // 旧版格式 (直接是 progress 对象)
                    const keys = Object.keys(parsedData);
                    // 简单的启发式检查：key 看起来像 ID，value 是 Status
                    if (keys.length > 0) {
                        isValid = true;
                        recordCount = keys.length;
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>设置</DialogTitle>
                        <DialogDescription>
                            管理您的应用偏好和数据。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
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
                    </div>

                    {/* 题库源配置区块 */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                            <Database className="h-4 w-4" />
                            题库源配置
                        </h3>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="默认为空 (使用内置题库)"
                                    value={repoUrlInput}
                                    onChange={(e) => setRepoUrlInput(e.target.value)}
                                    className="flex-1 text-sm"
                                />
                                <Button
                                    onClick={handleSaveRepoUrl}
                                    disabled={isCheckingRepo}
                                    size="sm"
                                >
                                    {isCheckingRepo ? "验证中..." : "保存"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                输入 GitHub Raw 地址或自定义 API 地址。例如: <br />
                                <code className="bg-muted px-1 py-0.5 rounded">https://raw.githubusercontent.com/username/repo/main/data</code>
                            </p>
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
