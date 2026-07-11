import { Readable } from "node:stream";
import * as DTO from "./stories.dto";
import * as gemini from "../../shared/gemini.service";
import * as elevenlabs from "../../shared/elevenlabs.service";
import * as spaces from "../../shared/spaces.service";

// helpers
const lengthToWordCount: Record<DTO.GenerateRequest["length"], string> = {
  short: "50-150 words",
  medium: "200-500 words",
  long: "1000-1500 words",
};

// simple all at once generation
export async function generate({
  topic,
  mood,
  length,
}: DTO.GenerateRequest): Promise<DTO.GenerateResponse> {
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

  // get script from gemini
  const story = await gemini.completion(systemInstruction, contents);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `Provided Length: ${length}\nActual Word Count: ${story.trim().split(/\s+/).length}`
    );
  }

  // get audio from elevenlabs
  const audioStream = await elevenlabs.generate(story);

  // upload to object storage
  const audioUrl = await  spaces.upload(audioStream);

  return {
    id: `placeholder (replace when persistence is added)`,
    title: `placeholder (replace when I change llm response)`,
    story,
    audioUrl,
    durationSeconds: 0,
  };
}
