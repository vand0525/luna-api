import { ElevenLabsClient } from "elevenlabs";
import { Readable } from "node:stream";

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export async function generate(script: string): Promise<Readable> {
  const audioStream = await eleven.textToSpeech.convert(process.env.ELEVENLABS_VOICE_ID!, {
    text: script,
    model_id: process.env.ELEVENLABS_MODEL!,
  })

  return audioStream;
}