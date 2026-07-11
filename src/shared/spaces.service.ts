import { Readable } from "node:stream";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const spaces = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,

  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export async function upload(audioStream: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }

  const audioBuffer = Buffer.concat(chunks);

  const prefix = process.env.NODE_ENV === "development" ? "luna-dev" : "luna";
  const key = `${prefix}/${crypto.randomUUID()}.mp3`;

  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
      Body: audioBuffer,
      ContentType: "audio/mpeg",
      ACL: "public-read",
    })
  );

  return `${process.env.DO_SPACES_CDN_ENDPOINT}/${key}`;
}
