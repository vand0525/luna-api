import { Readable } from "node:stream";
import * as DTO from "./stories.dto";
import * as gemini from "../../shared/gemini.service";
import * as elevenlabs from "../../shared/elevenlabs.service";

// helpers
const lengthToWordCount: Record<DTO.GeneratePrompt["length"], string> = {
  short: "50-150 words",
  medium: "200-500 words",
  long: "1000-1500 words",
};

// simple all at once generation
export async function generate({
  topic,
  mood,
  length,
}: DTO.GeneratePrompt): Promise<Readable> {
  const systemInstruction = `
    You are an expert fiction writer.
    Write soothing bedtime stories for adults.
    Avoid childish language and avoid mature/adult themes.
  `;

  const contents = `
    Topic: ${topic}, 
    Mood: ${mood}, 
    Length: ${lengthToWordCount[length]}, 
  `;

  const script = await gemini.completion(systemInstruction, contents);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `Provided Length: ${length}\nActual Word Count: ${script.trim().split(/\s+/).length}`
    );
  }

  return await elevenlabs.generate(script);
}
