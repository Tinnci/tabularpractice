
import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { EurekaData } from "@/lib/types";

export function useGeminiEureka(apiKey: string | null) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateEureka = async (
        content: string,
        answer: string,
        analysis: string,
        modelName: string = "gemini-1.5-flash"
    ): Promise<EurekaData | null> => {
        if (!apiKey) {
            toast.error("API Key not configured");
            return null;
        }

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
            You are an expert math tutor designed to help students overcome cognitive blockages (Eureka moments).
            
            Given the following math problem, answer, and analysis, please generate a structured "Eureka" hint object.
            
            **Input Data:**
            ---
            **Question:** 
            ${content}
            
            **Answer:**
            ${answer}
            
            **Analysis:**
            ${analysis}
            ---

            **Goal:** 
            Analyze the "cognitive traps" of this problem. Why might a student get stuck?
            Generate a JSON object matching this TypeScript interface:

            \`\`\`typescript
            interface EurekaData {
              // 1. Diagnostic: Help students identify why they are stuck.
              diagnostic: {
                question: string; // e.g., "你觉得卡在哪里了？"
                options: Array<{
                  type: 'representation' | 'function' | 'constraint' | 'analogy';
                  label: string; // The cognitive block, e.g., "看不出积分区域的对称性"
                  hint: string;  // The nudge, e.g., "画出 y=x，看看区域是不是关于它对称？"
                }>;
              };

              // 2. Model Lineup: Compare the correct mental model with a common incorrect one.
              modelLineup: {
                question: string; // e.g., "这道题最像下面哪个模型？"
                options: Array<{
                  id: string; // "correct-model" or "wrong-model"
                  label: string; 
                  formula?: string; // LaTeX
                  isCorrect: boolean;
                  feedback: string;
                }>;
              };

              // 3. Variable Roles: Reframe specific variables/terms.
              variableRoles: Array<{
                target: string;      // The symbol, e.g., "y/x"
                currentRole: string; // Novice view, e.g., "两个变量相除"
                suggestedRole: string; // Expert view, e.g., "整体变量 u"
                transformation: string; // e.g., "Let y=ux"
              }>;

              // 4. Strategies: Step-by-step cognitive moves.
              strategies: Array<{
                title: string;    // e.g. "降维打击"
                trigger: string;  // e.g. "看到二重积分区域关于y=x对称"
                action: string;   // e.g. "利用轮换对称性化简"
              }>;

              // 5. Insight: The final "Aha!" summary.
              insight: string;
            }
            \`\`\`

            **Requirements:**
            1. Output ONLY valid JSON.
            2. Language: Simplified Chinese (zh-CN) for all display text.
            3. Use LaTeX for math expressions (e.g., $x^2$).
            4. Be concise and insightful.
            5. Ensure 'strategies' has 2-3 logical steps that guide the thinking process.
            `;

            const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const text = response.text;
            if (!text) throw new Error("No content generated");

            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson) as EurekaData;

            return parsed;

        } catch (error) {
            console.error("Eureka generation failed", error);
            toast.error("AI Generation Failed");
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        generateEureka
    };
}
