import { readFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Payload } from "payload";
import type { OwnerFile } from "@/payload-types";

/**
 * The bytes of a file an owner sent, wherever it is kept: the private R2 bucket when its credentials
 * are set (as payload.config.ts arranges), this machine's disk otherwise. For the server's own use
 * only; staff download files through the CMS, which checks who they are.
 */
export async function ownerFileBytes(payload: Payload, file: OwnerFile): Promise<Uint8Array> {
  if (!file.filename) throw new Error("The file has no name.");
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PRIVATE_BUCKET } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PRIVATE_BUCKET) {
    const s3 = new S3Client({
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    });
    const prefix = (file as OwnerFile & { prefix?: string | null }).prefix ?? "owner-files";
    const got = await s3.send(
      new GetObjectCommand({
        Bucket: R2_PRIVATE_BUCKET,
        Key: path.posix.join(prefix, file.filename),
      }),
    );
    if (!got.Body) throw new Error("The bucket returned no file.");
    return got.Body.transformToByteArray();
  }
  const dir = payload.collections["owner-files"].config.upload.staticDir;
  if (!dir) throw new Error("Owner files have no folder on this machine.");
  return readFile(path.join(dir, path.basename(file.filename)));
}
