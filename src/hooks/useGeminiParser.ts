import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";
import { Question, Paper, PaperGroup } from "@/lib/types";

export interface ParsedData {
    questions: Question[];
    paper: Paper;
    group: PaperGroup;
}

export function useGeminiParser(apiKey: string | null) {
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
        if (!apiKey || isFetchingModels) return;

        setIsFetchingModels(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const models = await ai.models.list();

            // Collect all models from the async iterable
            const allModels = [];
            for await (const model of models) {
                allModels.push(model);
            }

            // Filter for Gemini models that support generateContent
            const geminiModels = allModels
                .filter((m: unknown) => {
                    if (typeof m !== 'object' || m === null || !('name' in m)) return false;
                    const model = m as { name: string; supportedGenerationMethods?: string[] };
                    const methods = model.supportedGenerationMethods || [];
                    return model.name.includes('gemini') && methods.includes('generateContent');
                })
                .map((m: unknown) => (m as { name: string }).name.replace('models/', ''));

            setAvailableModels(geminiModels);
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast.error(DICT.ai.fetchFail);
            setAvailableModels(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']);
        } finally {
            setIsFetchingModels(false);
        }
    };

    const processFile = async (file: File, modelName: string): Promise<ParsedData | null> => {
        if (!file || !apiKey) return null;

        setIsProcessing(true);
        try {
            const base64Data = await fileToBase64(file);

            const ai = new GoogleGenAI({ apiKey });

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

            const text = response.text;
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
