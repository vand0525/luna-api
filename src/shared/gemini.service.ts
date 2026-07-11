import { GoogleGenAI } from "@google/genai";
import type { StoryGeneration } from "../features/stories/stories.types";

const llm = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function completion<T>(
  systemInstruction: string,
  contents: string,
  responseJsonSchema: object
): Promise<T> {
  const response = await llm.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents,
    config: {
      systemInstruction,
      responseJsonSchema,
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response");

  return JSON.parse(response.text) as T;
}
