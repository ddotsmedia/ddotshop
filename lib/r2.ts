import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const bucket = process.env.R2_BUCKET_NAME ?? "ddotsshop-assets";
const publicUrl = process.env.R2_PUBLIC_URL ?? "https://assets.ddotsshop.com";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

/** Upload a buffer to R2 and return its public URL. */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );
  return `${publicUrl}/${key}`;
}

/** Delete an object from R2 by key. */
export async function deleteFromR2(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
