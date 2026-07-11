import { ElevenLabsClient } from "elevenlabs";

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export async function generate(script: string): Promise<Buffer> {
  const audioStream = await eleven.textToSpeech.convert(
    process.env.ELEVENLABS_VOICE_ID!,
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
