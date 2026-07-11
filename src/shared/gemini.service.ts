import { GoogleGenAI } from "@google/genai";
import type { StoryGeneration } from "../features/stories/stories.types";

const llm = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function completion(
  systemInstruction: string,
  contents: string
): Promise<StoryGeneration> {
  const response = await llm.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents,
    config: {
      systemInstruction,
      responseJsonSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          story: {
            type: "string",
          },
        },
        required: ["title", "story"],
      },
    },
  });

  return JSON.parse(response.text!) ?? "";
}
