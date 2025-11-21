import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const getGeminiClient = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey);
};

export const getFileManager = (apiKey: string) => {
  return new GoogleAIFileManager(apiKey);
};
