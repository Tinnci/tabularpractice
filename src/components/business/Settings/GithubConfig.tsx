import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProgressStore } from "@/lib/store"
import { Github, RefreshCw, HelpCircle, AlertCircle } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function GithubConfig() {
    const {
        githubToken,
        setGithubToken,
        gistId,
        setGistId,
        syncStatus,
        syncData,
        lastSyncedTime,
        tokenScopes
    } = useProgressStore()

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

    // Check if we have scopes for gist and repo
    // GitHub: 'repo' scope grants full access to private and public repositories. It includes 'gist' access? No.
    // Documentation says 'gist' scope is for gists. 
    // Let's assume user needs explicit scopes.

    // Actually, let's just check strictly.
    const isGistReady = tokenScopes?.includes('gist');
    const isRepoReady = tokenScopes?.includes('repo') || tokenScopes?.includes('public_repo');

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Github className="h-4 w-4" />
                {DICT.settings.sync}
            </h3>

            <div className="space-y-3 p-4 border rounded-lg bg-card/50">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
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
                        {githubToken && (
                            <div className="flex gap-2">
                                <Badge variant={isGistReady ? "default" : "destructive"} className="text-[10px] h-5 px-1.5">
                                    {isGistReady ? "Gist Sync ✅" : "Gist Sync ❌"}
                                </Badge>
                                <Badge variant={isRepoReady ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
                                    {isRepoReady ? "Repo Write ✅" : "Repo Write ⚠️"}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <Input
                        type="password"
                        value={githubToken || ""}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="h-8 text-sm font-mono"
                    />
                    {!isGistReady && githubToken && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Token 缺少 gist 权限，同步功能不可用。
                        </p>
                    )}
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
                        disabled={syncStatus === 'syncing' || !githubToken || !isGistReady}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? "animate-spin" : ""}`} />
                        {syncStatus === 'syncing' ? DICT.settings.syncing : DICT.settings.syncNow}
                    </Button>
                </div>
            </div>
        </div>
    )
}
