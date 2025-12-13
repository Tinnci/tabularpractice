import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";
import { Question, Paper, PaperGroup } from "@/lib/types";
import { useProgressStore } from "@/lib/store";

export interface ParsedData {
    questions: Question[];
    paper: Paper;
    group: PaperGroup;
}

export function useGeminiParser() {
    const { geminiApiKey, vercelApiKey, aiProvider } = useProgressStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [rawResponse, setRawResponse] = useState("");

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
        setIsFetchingModels(true);
        try {
            if (aiProvider === 'google') {
                if (!geminiApiKey) {
                    setAvailableModels(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']);
                    return;
                }
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const models = await ai.models.list();

                const allModels = [];
                for await (const model of models) {
                    allModels.push(model);
                }

                const geminiModels = allModels
                    .filter((m: any) => {
                        const methods = m.supportedGenerationMethods || [];
                        return m.name.includes('gemini') && methods.includes('generateContent');
                    })
                    .map((m: any) => m.name.replace('models/', ''));

                setAvailableModels(geminiModels);
            } else {
                // For Vercel/OpenAI Gateway, we might not be able to list models easily without a dedicated endpoint or proxy.
                // We'll provide a standard list for now.
                setAvailableModels(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']);
                // If the user has a way to list models via their gateway, we could add it here.
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast.error(DICT.ai.fetchFail);
            setAvailableModels(
                aiProvider === 'google'
                    ? ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
                    : ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
            );
        } finally {
            setIsFetchingModels(false);
        }
    };

    const processFile = async (file: File, modelName: string): Promise<ParsedData | null> => {
        if (!file) return null;
        if (aiProvider === 'google' && !geminiApiKey) {
            toast.error(DICT.aiSettings.apiKeyRequired);
            return null;
        }
        if (aiProvider === 'vercel' && !vercelApiKey) {
            toast.error(DICT.aiSettings.apiKeyRequired);
            return null;
        }

        setIsProcessing(true);
        try {
            const base64Data = await fileToBase64(file);

            const prompt = `
            ${DICT.ai.promptRole}
            
            ${DICT.ai.promptGoal}
            {
                "group": {
                    "id": "auto-gen-group-${Date.now()}",
                    "name": "${DICT.ai.mockPaperGroup}",
                    "type": "self_proposed",
                    "university": "${DICT.ai.mockUniversity}",
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
                        "contentMd": "${DICT.ai.mockContent}",
                        "answerMd": "${DICT.ai.mockAnswer}",
                        "analysisMd": "${DICT.ai.mockAnalysis}"
                    }
                ]
            }

            ${DICT.ai.promptRequirements}
            1. ${DICT.ai.req1}
            2. ${DICT.ai.req2}
            3. ${DICT.ai.req3}
            4. ${DICT.ai.req4}
            5. ${DICT.ai.req5}
            6. ${DICT.ai.req6}
            `;

            let text = "";

            if (aiProvider === 'google') {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey! });
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType: file.type, data: base64Data } }
                            ]
                        }
                    ],
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                text = response.text || "";
            } else {
                // Vercel AI Gateway / OpenAI Compatible (via fetch to avoid openai package)
                // Default to OpenAI URL or allow base URL config if we had it.
                // For Vercel AI Gateway, users often use a custom base URL.
                // We'll assume standard OpenAI-compatible API for now as fallback.

                const response = await fetch("https://ai.vercel.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${vercelApiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:${file.type};base64,${base64Data}`
                                        }
                                    }
                                ]
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`API Error: ${response.status} ${err}`);
                }

                const data = await response.json();
                text = data.choices[0]?.message?.content || "";
            }

            if (!text) throw new Error("No content generated");

            // Basic cleanup
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            setRawResponse(cleanJson);

            const parsed = JSON.parse(cleanJson);
            return parsed as ParsedData;

        } catch (error) {
            console.error("Processing failed", error);
            toast.error(DICT.ai.parseFail);
            setRawResponse(JSON.stringify(error, null, 2));
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isProcessing,
        isFetchingModels,
        availableModels,
        rawResponse,
        fetchAvailableModels,
        processFile
    };
}
