import { ElevenLabsClient } from "elevenlabs";
import * as DTO from "../features/stories/stories.dto";

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const narratorTypeToId: Record<DTO.GenerateRequest["narratorType"], string> = {
  adaptive: process.env.ELEVENLABS_VOICE_ID!,
  default: process.env.ELEVENLABS_VOICE_ID!,
  warm: "XrExE9yKIg1WjnnlVkGX", 
  soft: "EXAVITQu4vr4xnSDxMaL", 
  deep: "GBv7mTt0atIp3Br8iCZE",
};

export async function generate(
  script: string,
  narratorType: DTO.GenerateRequest["narratorType"]
): Promise<Buffer> {
  const audioStream = await eleven.textToSpeech.convert(
    narratorTypeToId[narratorType],
    {
      text: script,
      model_id: process.env.ELEVENLABS_MODEL!,
    }
  );

  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
