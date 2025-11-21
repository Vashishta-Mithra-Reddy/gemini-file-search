import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(apiKey: string) {
    return new GoogleGenAI({ apiKey });
}
