import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProgressStore } from "@/lib/store";
import { Loader2, Upload, FileText, CheckCircle } from "lucide-react";
import { Question, Paper, PaperGroup } from "@/lib/types";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";
import { useGeminiParser } from "@/hooks/useGeminiParser";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function AiImportModal({ isOpen, onClose }: Props) {
    const { geminiApiKey, setGeminiApiKey, addCustomData } = useProgressStore();
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'api-key' | 'upload' | 'preview'>('api-key');
    const [parsedData, setParsedData] = useState<{ questions: Question[], paper: Paper, group: PaperGroup } | null>(null);
    const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

    const {
        isProcessing,
        isFetchingModels,
        availableModels,
        fetchAvailableModels,
        processFile: processFileApi
    } = useGeminiParser(geminiApiKey);

    // 如果已有 API Key，直接跳到上传步骤
    if (step === 'api-key' && geminiApiKey) {
        setStep('upload');
    }

    const handleSaveApiKey = () => {
        if (!apiKeyInput.trim()) {
            toast.error(DICT.ai.invalidKey);
            return;
        }
        setGeminiApiKey(apiKeyInput.trim());
        setStep('upload');
    };

    const handleDemoMode = () => {
        // Mocking demo state...
        setTimeout(() => {
            const mockData = {
                group: {
                    id: `demo-group-${Date.now()}`,
                    name: "Demo Group",
                    type: "self_proposed" as const,
                    university: "Demo U",
                    courseCode: "999"
                },
                paper: {
                    id: `demo-paper-${Date.now()}`,
                    groupId: `demo-group-${Date.now()}`,
                    year: 2024,
                    name: "Demo Paper"
                },
                questions: [
                    {
                        id: `demo-q-${Date.now()}-1`,
                        paperId: `demo-paper-${Date.now()}`,
                        number: 1,
                        type: "choice" as const,
                        tags: [],
                        contentMd: "What is 1 + 1?",
                        answerMd: "2",
                        analysisMd: "It is basic math."
                    },
                    {
                        id: `demo-q-${Date.now()}-2`,
                        paperId: `demo-paper-${Date.now()}`,
                        number: 2,
                        type: "answer" as const,
                        tags: [],
                        contentMd: "Explain the theory of relativity.",
                        answerMd: "E=mc^2",
                        analysisMd: "Energy equals mass times the speed of light squared."
                    }
                ]
            };
            setParsedData(mockData);
            setStep('preview');
            setFile(new File(["demo"], "demo.pdf"));
        }, 800);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processFile = async () => {
        if (!file) return;
        const data = await processFileApi(file, selectedModel);
        if (data) {
            setParsedData(data);
            setStep('preview');
        }
    };

    const handleImport = () => {
        if (parsedData) {
            addCustomData({
                questions: parsedData.questions,
                papers: [parsedData.paper],
                groups: [parsedData.group]
            });
            toast.success(DICT.ai.importSuccess.replace('{count}', String(parsedData.questions.length)));
            onClose();
            // Reset state
            setFile(null);
            setParsedData(null);
            setStep('upload');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{DICT.ai.title}</DialogTitle>
                    <DialogDescription>
                        {DICT.ai.desc}
                    </DialogDescription>
                </DialogHeader>

                {step === 'api-key' && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{DICT.ai.apiKeyLabel}</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder={DICT.ai.apiKeyPlaceholder}
                                    type="password"
                                />
                                <Button onClick={handleSaveApiKey}>{DICT.ai.saveApiKey}</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    {DICT.ai.apiKeyTip}
                                </p>
                                <Button variant="ghost" size="sm" onClick={handleDemoMode} disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                                    {DICT.ai.tryDemo}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'upload' && (
                    <div className="space-y-6 py-4">
                        {/* Model Selection */}
                        <div className="space-y-2">
                            <Label>{DICT.ai.selectModel}</Label>
                            <div className="flex gap-2">
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={DICT.ai.modelPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.length > 0 ? (
                                            availableModels.map(model => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                                                <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                                                <SelectItem value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    onClick={fetchAvailableModels}
                                    disabled={isFetchingModels}
                                >
                                    {isFetchingModels ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {DICT.ai.fetchingModels}
                                        </>
                                    ) : (
                                        DICT.ai.fetchModels
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {DICT.ai.fetchModelsTip}
                            </p>
                        </div>

                        {/* File Upload */}
                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">{DICT.ai.uploadTitle}</p>
                                <p className="text-sm text-muted-foreground mt-1">{DICT.ai.uploadDesc}</p>
                            </div>
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    <FileText className="w-4 h-4" />
                                    {file.name}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStep('api-key')}>{DICT.ai.modifyKey}</Button>
                            <Button onClick={processFile} disabled={!file || isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {DICT.ai.processing}
                                    </>
                                ) : (
                                    DICT.ai.startProcess
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'preview' && parsedData && (
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                {DICT.ai.successTitle}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{DICT.ai.paperName}:</span> {parsedData.paper.name}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{DICT.ai.year}:</span> {parsedData.paper.year}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{DICT.ai.questionCount}:</span> {parsedData.questions.length}
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto border rounded-md p-2 space-y-2">
                            {parsedData.questions.map((q, i) => (
                                <div key={i} className="p-3 border rounded bg-card text-sm">
                                    <div className="font-medium mb-1">{DICT.exam.questionIndex.replace('{number}', String(q.number))} ({q.type})</div>
                                    <div className="text-muted-foreground line-clamp-2">{q.contentMd}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStep('upload')}>{DICT.ai.reupload}</Button>
                            <Button onClick={handleImport}>{DICT.ai.confirmImport}</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
