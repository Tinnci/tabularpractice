"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useProgressStore } from "@/lib/store";
import { Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";

export function AiSettings() {
    const { geminiApiKey, setGeminiApiKey } = useProgressStore();
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
    const [showKey, setShowKey] = useState(false);

    const handleSave = () => {
        if (!apiKeyInput.trim()) {
            toast.error(DICT.aiSettings.apiKeyRequired);
            return;
        }
        setGeminiApiKey(apiKeyInput.trim());
        toast.success(DICT.aiSettings.apiKeySaved);
    };

    const handleRemove = () => {
        setGeminiApiKey(null);
        setApiKeyInput("");
        toast.success(DICT.aiSettings.apiKeyRemoved);
    };

    return (
        <Card className="p-4 space-y-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">{DICT.aiSettings.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                    {DICT.aiSettings.desc}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-xs">
                    {DICT.ui.geminiApiKey}
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
                        {DICT.aiSettings.save}
                    </Button>
                </div>

                {geminiApiKey && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 dark:text-green-400">
                            {DICT.aiSettings.apiKeyConfigured}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                            className="h-auto py-1 text-xs text-destructive hover:text-destructive"
                        >
                            {DICT.aiSettings.remove}
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
                        {DICT.aiSettings.getApiKey}
                    </a>
                </div>
            </div>

            {geminiApiKey && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                    <div className="text-xs font-medium">{DICT.aiSettings.enabledFeatures}</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>{DICT.aiSettings.feature1}</li>
                        <li>{DICT.aiSettings.feature2}</li>
                        <li>{DICT.aiSettings.feature3}</li>
                        <li>{DICT.aiSettings.feature4}</li>
                    </ul>
                </div>
            )}
        </Card>
    );
}
