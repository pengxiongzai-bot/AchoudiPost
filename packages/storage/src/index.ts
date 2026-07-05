import { randomInt } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import OSS from "ali-oss";
import sharp from "sharp";
import { fileExtension, isAllowedUpload, sha256 } from "@freedompost/security";

export type StorageProvider = "local" | "oss" | "r2";

export interface PutObjectInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  namespace?: string;
}

export interface StoredObject {
  storageProvider: StorageProvider;
  storageKey: string;
  publicUrl: string;
  storedFilename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export interface StorageAdapter {
  putObject(input: PutObjectInput): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export class UploadRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadRejectedError";
  }
}

interface PreparedObject {
  buffer: Buffer;
  storedFilename: string;
  originalFilename: string;
  contentDispositionFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

const storedFilenameAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const storedFilenameLength = 5;
const imageWebpMimeType = "image/webp";
const imageMaxDimension = 2560;

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl = "/uploads"
  ) {}

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const prepared = await prepareObject(input);
    const key = storageKey(input.namespace, prepared.storedFilename);
    const target = path.join(this.rootDir, key);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, prepared.buffer);

    return {
      storageProvider: "local",
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      storedFilename: prepared.storedFilename,
      originalFilename: prepared.originalFilename,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      sha256: prepared.sha256
    };
  }

  async deleteObject(key: string): Promise<void> {
    const root = path.resolve(this.rootDir);
    const target = path.resolve(root, key);

    if (!target.startsWith(`${root}${path.sep}`)) {
      throw new Error("Refusing to delete outside local storage root");
    }

    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}

export interface AliyunOssStorageOptions {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
  publicBaseUrl?: string;
  prefix?: string;
}

export interface CloudflareR2StorageOptions {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
  prefix?: string;
}

export class AliyunOssStorageAdapter implements StorageAdapter {
  private readonly client: OSS;

  constructor(private readonly options: AliyunOssStorageOptions) {
    this.client = new OSS({
      region: options.region,
      bucket: options.bucket,
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      endpoint: options.endpoint
    });
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const prepared = await prepareObject(input);
    const key = storageKey(input.namespace, prepared.storedFilename, this.options.prefix);

    await this.client.put(key, prepared.buffer, {
      headers: {
        "Content-Type": prepared.mimeType,
        "Content-Disposition": contentDisposition(prepared.contentDispositionFilename, prepared.mimeType)
      }
    });

    return {
      storageProvider: "oss",
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      storedFilename: prepared.storedFilename,
      originalFilename: prepared.originalFilename,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      sha256: prepared.sha256
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.delete(key);
  }

  getPublicUrl(key: string): string {
    if (this.options.publicBaseUrl) {
      return `${this.options.publicBaseUrl.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
    }

    return `https://${this.options.bucket}.${this.options.region}.aliyuncs.com/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }
}

export class CloudflareR2StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;

  constructor(private readonly options: CloudflareR2StorageOptions) {
    this.client = new S3Client({
      region: "auto",
      endpoint: options.endpoint ?? `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    });
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const prepared = await prepareObject(input);
    const key = storageKey(input.namespace, prepared.storedFilename, this.options.prefix);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: prepared.buffer,
        ContentType: prepared.mimeType,
        ContentDisposition: contentDisposition(prepared.contentDispositionFilename, prepared.mimeType)
      })
    );

    return {
      storageProvider: "r2",
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      storedFilename: prepared.storedFilename,
      originalFilename: prepared.originalFilename,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      sha256: prepared.sha256
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: key
      })
    );
  }

  getPublicUrl(key: string): string {
    if (this.options.publicBaseUrl) {
      return `${this.options.publicBaseUrl.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
    }

    return `https://${this.options.bucket}.${this.options.accountId}.r2.cloudflarestorage.com/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }
}

function contentDisposition(filename: string, mimeType: string): string {
  const encoded = encodeURIComponent(filename);
  const disposition = mimeType.startsWith("image/") ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encoded}`;
}

async function prepareObject(input: PutObjectInput): Promise<PreparedObject> {
  if (!isAllowedUpload(input.originalFilename, input.mimeType)) {
    throw new UploadRejectedError("Unsupported upload type");
  }

  const mimeType = normalizeMimeType(input.mimeType);
  if (mimeType.startsWith("image/")) {
    const buffer = await convertImageToWebp(input.buffer);
    const contentDispositionFilename = `${filenameStem(input.originalFilename) || "image"}.webp`;

    return {
      buffer,
      storedFilename: `${randomStoredBasename()}.webp`,
      originalFilename: input.originalFilename,
      contentDispositionFilename,
      mimeType: imageWebpMimeType,
      sizeBytes: buffer.byteLength,
      sha256: sha256(buffer)
    };
  }

  const extension = fileExtension(input.originalFilename);
  const buffer = input.buffer;

  return {
    buffer,
    storedFilename: `${randomStoredBasename()}.${extension}`,
    originalFilename: input.originalFilename,
    contentDispositionFilename: input.originalFilename,
    mimeType,
    sizeBytes: buffer.byteLength,
    sha256: sha256(buffer)
  };
}

async function convertImageToWebp(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer, { animated: true })
      .rotate()
      .resize({
        width: imageMaxDimension,
        height: imageMaxDimension,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 82,
        effort: 5
      })
      .toBuffer();
  } catch {
    throw new UploadRejectedError("Unsupported image upload");
  }
}

function storageKey(namespace: string | undefined, storedFilename: string, prefix?: string): string {
  const now = new Date();

  return [
    prefix?.replace(/^\/|\/$/g, ""),
    namespace ?? "general",
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    storedFilename
  ]
    .filter(Boolean)
    .join("/");
}

function randomStoredBasename(): string {
  let value = "";

  for (let index = 0; index < storedFilenameLength; index += 1) {
    value += storedFilenameAlphabet.charAt(randomInt(storedFilenameAlphabet.length));
  }

  return value;
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase().split(";")[0]?.trim() || "application/octet-stream";
}

function filenameStem(filename: string): string {
  const name = path.basename(filename);
  const extension = path.extname(name);
  return extension ? name.slice(0, -extension.length) : name;
}
