import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  AliyunOssStorageAdapter,
  LocalStorageAdapter,
  type StorageAdapter
} from "@freedompost/storage";

export function createStorageAdapter(): StorageAdapter {
  if (process.env.STORAGE_DRIVER === "oss") {
    const region = requiredEnv("ALIYUN_OSS_REGION");
    const bucket = requiredEnv("ALIYUN_OSS_BUCKET");
    const accessKeyId = requiredEnv("ALIYUN_OSS_ACCESS_KEY_ID");
    const accessKeySecret = requiredEnv("ALIYUN_OSS_ACCESS_KEY_SECRET");

    return new AliyunOssStorageAdapter({
      region,
      bucket,
      accessKeyId,
      accessKeySecret,
      ...(process.env.ALIYUN_OSS_ENDPOINT ? { endpoint: process.env.ALIYUN_OSS_ENDPOINT } : {}),
      ...(process.env.ALIYUN_OSS_PUBLIC_BASE_URL
        ? { publicBaseUrl: process.env.ALIYUN_OSS_PUBLIC_BASE_URL }
        : {}),
      prefix: process.env.ALIYUN_OSS_PREFIX ?? "freedompost/uploads"
    });
  }

  return new LocalStorageAdapter(localStorageRoot(), process.env.PUBLIC_UPLOAD_BASE_URL ?? "/api/uploads");
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when STORAGE_DRIVER=oss`);
  }
  return value;
}

export function localStorageRoot(): string {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_ROOT ?? "runtime/local-storage");
}

export async function getLocalUploadStream(storageKey: string) {
  const root = localStorageRoot();
  const target = path.resolve(root, storageKey);

  if (!target.startsWith(root)) {
    return null;
  }

  try {
    const fileStat = await stat(target);
    if (!fileStat.isFile()) return null;
    return {
      stream: createReadStream(target),
      size: fileStat.size,
      contentType: contentTypeFromFilename(target)
    };
  } catch {
    return null;
  }
}

function contentTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".json": "application/json",
    ".csv": "text/csv; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime"
  };

  return map[ext] ?? "application/octet-stream";
}
