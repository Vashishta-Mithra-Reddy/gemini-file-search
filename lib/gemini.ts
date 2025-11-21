import { GoogleAIFileManager } from "@google/generative-ai/server";

export const getFileManager = (apiKey: string) => {
  return new GoogleAIFileManager(apiKey);
};
