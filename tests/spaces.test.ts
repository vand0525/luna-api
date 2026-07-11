import "dotenv/config";

import { ElevenLabsClient } from "elevenlabs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const spaces = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,

  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

async function main() {
  const audioStream = await eleven.textToSpeech.convert(
    "21m00Tcm4TlvDq8ikWAM",
    {
      text: "Hello BIG EDAMAME!",
      model_id: "eleven_multilingual_v2",
    }
  );

  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }

  const audioBuffer = Buffer.concat(chunks);
  const key = `tests/${crypto.randomUUID()}.mp3`;

  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
      Body: audioBuffer,
      ContentType: "audio/mpeg",
      ACL: "public-read",
    })
  );

  console.log(`${process.env.DO_SPACES_CDN_ENDPOINT}/${key}`);
}

main().catch(console.error);
