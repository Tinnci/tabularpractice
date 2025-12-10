import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProgressStore } from "@/lib/store"
import { Github, RefreshCw, HelpCircle, AlertCircle, ExternalLink, Check, X, AlertTriangle } from "lucide-react"
import { DICT } from "@/lib/i18n"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

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
    const isGistReady = tokenScopes?.includes('gist');
    const isRepoReady = tokenScopes?.includes('repo') || tokenScopes?.includes('public_repo');

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Github className="h-4 w-4" />
                {DICT.settings.sync}
            </h3>

            <div className="space-y-4 p-4 border rounded-lg bg-card/50">
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
                        <a
                            href="https://github.com/settings/tokens/new?description=TabularPractice&scopes=gist,repo"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            Generate New Token <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                    <Input
                        type="password"
                        value={githubToken || ""}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="h-8 text-sm font-mono"
                    />

                    {githubToken && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 p-2 rounded-md border border-border/50 mt-2">
                            <div className="flex items-center gap-2 text-xs">
                                {isGistReady ?
                                    <Check className="h-3.5 w-3.5 text-green-500" /> :
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                }
                                <span className={isGistReady ? "text-foreground" : "text-muted-foreground"}>
                                    Gist Sync (Sync Data)
                                </span>
                            </div>
                            {!isGistReady && (
                                <div className="col-span-full text-[10px] text-red-500 flex items-center gap-1 mt-1 border-t pt-1 border-border/50">
                                    <AlertCircle className="h-3 w-3" />
                                    Missing &apos;gist&apos; scope. Sync disabled.
                                </div>
                            )}
                        </div>
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
