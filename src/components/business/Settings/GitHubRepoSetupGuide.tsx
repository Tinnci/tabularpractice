"use client";

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Key,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useProgressStore } from "@/lib/store";
import { githubEditor } from "@/services/githubEditor";
import { DICT } from "@/lib/i18n";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type Step = 'check' | 'guide' | 'input' | 'verify' | 'success';

export function GitHubRepoSetupGuide({ isOpen, onClose, onSuccess }: Props) {
    const { githubToken, setGithubToken } = useProgressStore();
    const [currentStep, setCurrentStep] = useState<Step>('check');
    const [tokenInput, setTokenInput] = useState(githubToken || '');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{
        hasPermission: boolean;
        error?: string;
    } | null>(null);

    const checkExistingToken = async () => {
        if (!githubToken) {
            setCurrentStep('guide');
            return;
        }

        setIsVerifying(true);
        const result = await githubEditor.checkRepoPermission();
        setVerificationResult(result);
        setIsVerifying(false);

        if (result.hasPermission) {
            setCurrentStep('success');
        } else {
            setCurrentStep('guide');
        }
    };

    const handleVerifyToken = async () => {
        if (!tokenInput.trim()) {
            toast.error(DICT.github.enterToken);
            return;
        }

        setIsVerifying(true);

        // 临时保存 token 用于验证
        const originalToken = githubToken;
        setGithubToken(tokenInput.trim());

        const result = await githubEditor.checkRepoPermission();
        setVerificationResult(result);
        setIsVerifying(false);

        if (result.hasPermission) {
            toast.success(DICT.github.tokenVerified);
            setCurrentStep('success');
        } else {
            // 验证失败，恢复原 token
            setGithubToken(originalToken);
            toast.error(result.error || DICT.github.tokenVerifyFailed);
        }
    };

    const handleComplete = () => {
        onSuccess?.();
        onClose();
    };

    // 初次打开时自动检查
    useEffect(() => {
        if (isOpen && currentStep === 'check') {
            checkExistingToken();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        {DICT.github.configRepoPermission}
                    </DialogTitle>
                    <DialogDescription>
                        {DICT.github.configRepoPermissionDesc} <code className="bg-muted px-1 rounded">repo</code> {DICT.github.permission}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1: 检查中 */}
                    {currentStep === 'check' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{DICT.github.checkingConfig}</p>
                        </div>
                    )}

                    {/* Step 2: 引导创建 Token */}
                    {currentStep === 'guide' && (
                        <div className="space-y-6">
                            {verificationResult && !verificationResult.hasPermission && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            {DICT.editor.tokenInsufficient}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                            {verificationResult.error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="font-semibold text-base">📝 创建新的 GitHub Token</h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                                        <div className="space-y-2 flex-1">
                                            <p>{DICT.github.openTokenPage}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => window.open('https://github.com/settings/tokens/new', '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                前往 GitHub 创建 Token
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                                        <div className="space-y-2 flex-1">
                                            <p>{DICT.github.fillTokenInfo}</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                                                <li><strong>Note:</strong> {DICT.github.tokenNote}</li>
                                                <li><strong>Expiration:</strong> 90 days</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                                        <div className="space-y-2 flex-1">
                                            <p>{DICT.github.selectPermissions}</p>
                                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                                <p className="text-xs font-medium">必须勾选：</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono">
                                                        ☑ repo
                                                    </code>
                                                    <span className="text-xs text-muted-foreground">
                                                        (完整的仓库访问权限)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    💡 如果你的题库仓库是私有的，必须勾选完整的 <code className="bg-muted px-1 rounded">repo</code> 权限
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                                        <div className="space-y-2 flex-1">
                                            <p>{DICT.github.clickGenerate} <strong>Generate token</strong> {DICT.github.copyToken}</p>
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-2">
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                    ⚠️ Token 只会显示一次，请务必保存！
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={onClose}>
                                    {DICT.common.cancel}
                                </Button>
                                <Button onClick={() => setCurrentStep('input')} className="gap-2">
                                    {DICT.github.tokenCreated}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: 输入 Token */}
                    {currentStep === 'input' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>GitHub Personal Access Token</Label>
                                    <Input
                                        type="password"
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={tokenInput}
                                        onChange={(e) => setTokenInput(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {DICT.settings.tokenTip}
                                    </p>
                                </div>

                                {verificationResult && !verificationResult.hasPermission && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex gap-2">
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                        <div className="space-y-1 flex-1">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                                {DICT.github.tokenVerifyFailed}
                                            </p>
                                            <p className="text-xs text-red-700 dark:text-red-300">
                                                {verificationResult.error}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button variant="outline" onClick={() => setCurrentStep('guide')}>
                                    {DICT.common.back}
                                </Button>
                                <Button
                                    onClick={handleVerifyToken}
                                    disabled={!tokenInput.trim() || isVerifying}
                                    className="gap-2"
                                >
                                    {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {DICT.settings.validate}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: 成功 */}
                    {currentStep === 'success' && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">{DICT.syncToast.configSuccess}</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        {DICT.github.configSuccess}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                                <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
                                    📚 下一步
                                </h4>
                                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                                    <li>{DICT.github.editInDetail}</li>
                                    <li>• {DICT.common.edit}</li>
                                    <li>{DICT.github.saveAndSync}</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button onClick={handleComplete} className="gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {DICT.common.start}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
