"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProgressStore } from "@/lib/store";
import { Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";

export function AiSettings() {
    const {
        geminiApiKey,
        setGeminiApiKey,
        vercelApiKey,
        setVercelApiKey,
        aiProvider,
        setAiProvider
    } = useProgressStore();

    // Local state for inputs
    const [googleKeyInput, setGoogleKeyInput] = useState(geminiApiKey || "");
    const [vercelKeyInput, setVercelKeyInput] = useState(vercelApiKey || "");
    const [showKey, setShowKey] = useState(false);

    // Update local state when store changes (e.g. hydration)
    useEffect(() => {
        if (geminiApiKey) setGoogleKeyInput(geminiApiKey);
        if (vercelApiKey) setVercelKeyInput(vercelApiKey);
    }, [geminiApiKey, vercelApiKey]);

    const handleSave = () => {
        if (aiProvider === 'google') {
            if (!googleKeyInput.trim()) {
                toast.error(DICT.aiSettings.apiKeyRequired);
                return;
            }
            setGeminiApiKey(googleKeyInput.trim());
        } else {
            if (!vercelKeyInput.trim()) {
                toast.error(DICT.aiSettings.apiKeyRequired);
                return;
            }
            setVercelApiKey(vercelKeyInput.trim());
        }
        toast.success(DICT.aiSettings.apiKeySaved);
    };

    const handleRemove = () => {
        if (aiProvider === 'google') {
            setGeminiApiKey(null);
            setGoogleKeyInput("");
        } else {
            setVercelApiKey(null);
            setVercelKeyInput("");
        }
        toast.success(DICT.aiSettings.apiKeyRemoved);
    };

    const currentKey = aiProvider === 'google' ? geminiApiKey : vercelApiKey;
    const currentInput = aiProvider === 'google' ? googleKeyInput : vercelKeyInput;
    const setByKey = aiProvider === 'google' ? setGoogleKeyInput : setVercelKeyInput;

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

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs">{DICT.aiSettings.provider}</Label>
                    <RadioGroup
                        value={aiProvider}
                        onValueChange={(v: string) => setAiProvider(v as 'google' | 'vercel')}
                        className="flex flex-col space-y-1"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="google" id="provider-google" />
                            <Label htmlFor="provider-google" className="text-xs font-normal cursor-pointer">
                                {DICT.aiSettings.googleGemini}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vercel" id="provider-vercel" />
                            <Label htmlFor="provider-vercel" className="text-xs font-normal cursor-pointer">
                                {DICT.aiSettings.vercelAiGateway}
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs">
                        {aiProvider === 'google' ? "Gemini API Key" : "Vercel / OpenAI API Key"}
                    </Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="api-key"
                                type={showKey ? "text" : "password"}
                                value={currentInput}
                                onChange={(e) => setByKey(e.target.value)}
                                placeholder={aiProvider === 'google' ? "AIzaSy..." : DICT.aiSettings.vercelKeyPlaceholder}
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
                        <Button size="sm" onClick={handleSave} disabled={!currentInput.trim()}>
                            {DICT.aiSettings.save}
                        </Button>
                    </div>

                    {currentKey && (
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

                    {aiProvider === 'google' && (
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
                    )}
                </div>
            </div>

            {(geminiApiKey || vercelApiKey) && (
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
