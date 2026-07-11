import * as DTO from "./stories.dto";
import * as gemini from "../../shared/gemini.service";
import * as elevenlabs from "../../shared/elevenlabs.service";
import * as spaces from "../../shared/spaces.service";
import * as agents from "./stories.agents";
import type { StoryGeneration } from "./stories.types";
import { parseBuffer, getSupportedMimeTypes } from "music-metadata";

// helpers
const lengthToWordCount: Record<DTO.GenerateRequest["length"], string> = {
  short: "50-150 words",
  medium: "200-500 words",
  long: "1000-1500 words",
};

// pipeline
export async function generate(
  body: DTO.GenerateRequest
): Promise<DTO.GenerateResponse> {
  // get script from gemini
  const { title, story } = await orchestratedGeneration(body);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `Requested Length: ${lengthToWordCount[body.length]}\nActual Word Count: ${story.trim().split(/\s+/).length}`
    );
  }

  // get audio from elevenlabs
  const audioBuffer = await elevenlabs.generate(story, body.narratorType);

  const metadata = await parseBuffer(
    audioBuffer,
    {
      mimeType: "audio/mpeg",
      path: "audio.mp3", //
    },
    { duration: true }
  );

  const durationSeconds = Math.round(metadata.format.duration ?? 0);
  const audioUrl = await spaces.upload(audioBuffer);

  return {
    id: `placeholder (replace when persistence is added)`,
    title,
    story,
    audioUrl,
    durationSeconds,
  };
}

// all at once story generation
async function simpleGeneration({
  topic,
  mood,
  length,
}: DTO.GenerateRequest): Promise<StoryGeneration> {
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

  return await gemini.completion<StoryGeneration>(systemInstruction, contents, {
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
    additionalProperties: false,
  });
}

// orchestrated generation
export async function orchestratedGeneration(
  body: DTO.GenerateRequest
): Promise<StoryGeneration> {
  const outline = await agents.outliner(body);

  const [characters, setting] = await Promise.all([
    agents.characterDesigner(body, outline),
    agents.settingDesigner(body, outline),
  ]);

  const story = await agents.finalWriter(body, outline, characters, setting);

  return agents.toneAnnotator(body, story);
}
