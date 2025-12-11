"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useProgressStore } from "@/lib/store";
import { Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function AiSettings() {
    const { geminiApiKey, setGeminiApiKey } = useProgressStore();
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
    const [showKey, setShowKey] = useState(false);

    const handleSave = () => {
        if (!apiKeyInput.trim()) {
            toast.error("API Key 不能为空");
            return;
        }
        setGeminiApiKey(apiKeyInput.trim());
        toast.success("Gemini API Key 已保存");
    };

    const handleRemove = () => {
        setGeminiApiKey(null);
        setApiKeyInput("");
        toast.success("API Key 已移除");
    };

    return (
        <Card className="p-4 space-y-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">AI 功能配置</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                    配置 Gemini API Key 以启用 AI 辅助功能（题目导入、智能提示、适应性测验等）
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-xs">
                    Gemini API Key
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="gemini-key"
                            type={showKey ? "text" : "password"}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showKey ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <Button size="sm" onClick={handleSave} disabled={!apiKeyInput.trim()}>
                        保存
                    </Button>
                </div>

                {geminiApiKey && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 dark:text-green-400">
                            ✓ API Key 已配置
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                            className="h-auto py-1 text-xs text-destructive hover:text-destructive"
                        >
                            移除
                        </Button>
                    </div>
                )}

                <div className="pt-2 border-t">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <ExternalLink className="w-3 h-3" />
                        获取 Gemini API Key
                    </a>
                </div>
            </div>

            {geminiApiKey && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                    <div className="text-xs font-medium">已启用的 AI 功能:</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>AI 智能题目导入（PDF → 结构化数据）</li>
                        <li>AI 辅助生成顿悟提示</li>
                        <li>适应性测验（即将推出）</li>
                        <li>知识图谱自动构建（即将推出）</li>
                    </ul>
                </div>
            )}
        </Card>
    );
}
