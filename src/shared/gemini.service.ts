import { GoogleGenAI } from "@google/genai";

const llm = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function completion(systemInstruction: string, contents: string): Promise<string> {
  const response = await llm.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents,
    config: {
      systemInstruction
    }
  });

  return response.text ?? "";
}
