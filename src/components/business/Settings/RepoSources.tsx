import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Database, Lock, Edit2, RefreshCw, GitFork } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { useProgressStore } from "@/lib/store"
import { toast } from "sonner"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

export function RepoSources() {
    const { repoSources, addRepoSource, removeRepoSource, toggleRepoSource, checkSourcePermission } = useProgressStore()
    const [newRepoName, setNewRepoName] = useState("")
    const [newRepoUrl, setNewRepoUrl] = useState("")
    const [isCheckingRepo, setIsCheckingRepo] = useState(false)
    const [checkingPermId, setCheckingPermId] = useState<string | null>(null)

    const handleCheckPermission = async (id: string) => {
        setCheckingPermId(id);
        await checkSourcePermission(id);
        setCheckingPermId(null);
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
            toast.success(DICT.settings.toast.sourceAdded);
        } catch (error) {
            console.error(error);
            toast.error(DICT.settings.toast.sourceVerifyFailed);
        } finally {
            setIsCheckingRepo(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Database className="h-4 w-4" />
                {DICT.settings.repo}
            </h3>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                {DICT.settings.repoDesc}
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">{DICT.settings.savedRepos}</div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {repoSources?.map(source => (
                        <div key={source.id} className="flex flex-col gap-2 p-3 rounded-md border border-border bg-card hover:bg-accent/30 transition-colors">
                            <div className="flex items-center justify-between">
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
                                            setTimeout(() => window.location.reload(), 800);
                                        }}
                                    />
                                    {!source.isBuiltin && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                            onClick={() => removeRepoSource(source.id)}
                                        >
                                            <span className="sr-only">{DICT.common.delete}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Permission Status Bar */}
                            {!source.isBuiltin && source.url.includes('github') && (
                                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                    {source.permission === 'admin' || source.permission === 'write' ? (
                                        <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-green-500/10 text-green-600 border-green-200">
                                            <Edit2 className="h-3 w-3" /> Writable
                                        </Badge>
                                    ) : source.permission === 'read' ? (
                                        <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-secondary text-muted-foreground">
                                            <Lock className="h-3 w-3" /> Read-Only
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-5 gap-1 border-dashed text-muted-foreground">
                                            Unknown
                                        </Badge>
                                    )}

                                    {source.isFork && (
                                        <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-blue-500/10 text-blue-600 border-blue-200">
                                            <GitFork className="h-3 w-3" /> Fork
                                        </Badge>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 px-2 text-[10px] ml-auto text-muted-foreground"
                                        onClick={() => handleCheckPermission(source.id)}
                                        disabled={checkingPermId === source.id}
                                    >
                                        <RefreshCw className={`h-3 w-3 mr-1 ${checkingPermId === source.id ? 'animate-spin' : ''}`} />
                                        Check Access
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

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
            </div>
        </div>
    )
}
