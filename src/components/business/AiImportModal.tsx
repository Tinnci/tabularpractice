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
import { GoogleGenAI } from "@google/genai";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function AiImportModal({ isOpen, onClose }: Props) {
    const { geminiApiKey, setGeminiApiKey, addCustomData } = useProgressStore();
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'api-key' | 'upload' | 'preview'>('api-key');
    const [parsedData, setParsedData] = useState<{ questions: Question[], paper: Paper, group: PaperGroup } | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rawResponse, setRawResponse] = useState("");
    const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);

    // 如果已有 API Key，直接跳到上传步骤
    if (step === 'api-key' && geminiApiKey) {
        setStep('upload');
    }

    const handleSaveApiKey = () => {
        if (!apiKeyInput.trim()) {
            toast.error("请输入有效的 API Key");
            return;
        }
        setGeminiApiKey(apiKeyInput.trim());
        setStep('upload');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const fetchAvailableModels = async () => {
        if (!geminiApiKey || isFetchingModels) return;

        setIsFetchingModels(true);
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const models = await ai.models.list();

            // Collect all models from the async iterable
            const allModels = [];
            for await (const model of models) {
                allModels.push(model);
            }

            // Filter for Gemini models that support generateContent
            const geminiModels = allModels
                .filter((m: any) => {
                    if (!m.name) return false;
                    const methods = m.supportedGenerationMethods || [];
                    return m.name.includes('gemini') && methods.includes('generateContent');
                })
                .map((m: any) => m.name.replace('models/', ''));

            setAvailableModels(geminiModels);

            // Set default model if not in list
            if (geminiModels.length > 0 && !geminiModels.includes(selectedModel)) {
                setSelectedModel(geminiModels[0]);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast.error('获取模型列表失败，使用默认模型');
            setAvailableModels(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']);
        } finally {
            setIsFetchingModels(false);
        }
    };

    const processFile = async () => {
        if (!file || !geminiApiKey) return;

        setIsProcessing(true);
        try {
            const base64Data = await fileToBase64(file);

            const ai = new GoogleGenAI({ apiKey: geminiApiKey });

            const prompt = `
            你是一个专业的试卷解析助手。请分析上传的 PDF 文件，提取其中的试题信息。
            请严格按照以下 JSON 格式返回数据，不要包含 Markdown 代码块标记（如 \`\`\`json），直接返回纯 JSON 字符串。
            
            目标 JSON 结构:
            {
                "group": {
                    "id": "auto-gen-group-${Date.now()}",
                    "name": "AI 导入试卷组",
                    "type": "self_proposed",
                    "university": "未知大学",
                    "courseCode": "000"
                },
                "paper": {
                    "id": "auto-gen-paper-${Date.now()}",
                    "groupId": "auto-gen-group-${Date.now()}",
                    "year": ${new Date().getFullYear()},
                    "name": "${file.name.replace('.pdf', '')}"
                },
                "questions": [
                    {
                        "id": "auto-gen-q-${Date.now()}-1",
                        "paperId": "auto-gen-paper-${Date.now()}",
                        "number": 1,
                        "type": "answer",
                        "tags": [],
                        "contentMd": "题目内容...",
                        "answerMd": "答案内容...",
                        "analysisMd": "解析内容..."
                    }
                ]
            }

            要求：
            1. 自动识别试卷名称、年份（如果文件名或内容包含）。
            2. 尽可能提取所有题目，保持题号顺序。
            3. contentMd, answerMd, analysisMd 使用 Markdown 格式。
            4. 如果没有答案或解析，留空或根据题目内容推断。
            5. type 字段根据题目类型自动判断 ('choice', 'fill', 'answer')。
            6. 确保所有 ID 唯一且关联正确。
            `;

            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: file.type, data: base64Data } }
                        ]
                    }
                ]
            });

            const text = response.text;
            if (!text) throw new Error("No content generated");

            // 清理可能存在的 Markdown 代码块标记
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            setRawResponse(cleanJson);

            const parsed = JSON.parse(cleanJson);
            setParsedData(parsed);
            setStep('preview');

        } catch (error) {
            console.error("Processing failed", error);
            toast.error("解析失败，请检查 API Key 或文件内容");
            setRawResponse(JSON.stringify(error, null, 2));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = () => {
        if (parsedData) {
            addCustomData({
                questions: parsedData.questions,
                papers: [parsedData.paper],
                groups: [parsedData.group]
            });
            toast.success(`成功导入 ${parsedData.questions.length} 道题目`);
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
                    <DialogTitle>AI 智能导题 (Beta)</DialogTitle>
                    <DialogDescription>
                        利用 Gemini Flash 模型，一键将 PDF 试卷转换为题库数据。
                    </DialogDescription>
                </DialogHeader>

                {step === 'api-key' && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Gemini API Key</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="AIzaSy..."
                                    type="password"
                                />
                                <Button onClick={handleSaveApiKey}>保存</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                您的 Key 仅存储在本地浏览器中，直接请求 Google API，不经过任何第三方服务器。
                            </p>
                        </div>
                    </div>
                )}

                {step === 'upload' && (
                    <div className="space-y-6 py-4">
                        {/* Model Selection */}
                        <div className="space-y-2">
                            <Label>选择模型</Label>
                            <div className="flex gap-2">
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="选择 Gemini 模型" />
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
                                            获取中...
                                        </>
                                    ) : (
                                        "获取模型"
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                点击"获取模型"查看您的 API Key 可用的所有模型
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
                                <p className="font-medium">点击或拖拽上传 PDF 文件</p>
                                <p className="text-sm text-muted-foreground mt-1">支持扫描件或电子版 PDF</p>
                            </div>
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    <FileText className="w-4 h-4" />
                                    {file.name}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStep('api-key')}>修改 Key</Button>
                            <Button onClick={processFile} disabled={!file || isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        AI 解析中...
                                    </>
                                ) : (
                                    "开始识别"
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
                                解析成功
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">试卷名称:</span> {parsedData.paper.name}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">年份:</span> {parsedData.paper.year}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">题目数量:</span> {parsedData.questions.length}
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto border rounded-md p-2 space-y-2">
                            {parsedData.questions.map((q, i) => (
                                <div key={i} className="p-3 border rounded bg-card text-sm">
                                    <div className="font-medium mb-1">第 {q.number} 题 ({q.type})</div>
                                    <div className="text-muted-foreground line-clamp-2">{q.contentMd}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStep('upload')}>重新上传</Button>
                            <Button onClick={handleImport}>确认导入</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
