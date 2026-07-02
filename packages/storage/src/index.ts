import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import OSS from "ali-oss";
import { fileExtension, isAllowedUpload, sha256 } from "@freedompost/security";

export interface PutObjectInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  namespace?: string;
}

export interface StoredObject {
  storageProvider: "local" | "oss";
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

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl = "/uploads"
  ) {}

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    if (!isAllowedUpload(input.originalFilename, input.mimeType)) {
      throw new UploadRejectedError("Unsupported upload type");
    }

    const now = new Date();
    const extension = fileExtension(input.originalFilename);
    const storedFilename = `${randomUUID()}.${extension}`;
    const namespace = input.namespace ?? "general";
    const key = [
      namespace,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
      storedFilename
    ].join("/");
    const target = path.join(this.rootDir, key);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);

    return {
      storageProvider: "local",
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      storedFilename,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      sha256: sha256(input.buffer)
    };
  }

  async deleteObject(_key: string): Promise<void> {
    // Deletion is implemented when ownership/reference counting is wired to the DB.
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
    if (!isAllowedUpload(input.originalFilename, input.mimeType)) {
      throw new UploadRejectedError("Unsupported upload type");
    }

    const now = new Date();
    const extension = fileExtension(input.originalFilename);
    const storedFilename = `${randomUUID()}.${extension}`;
    const namespace = input.namespace ?? "general";
    const key = [
      this.options.prefix?.replace(/^\/|\/$/g, ""),
      namespace,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
      storedFilename
    ]
      .filter(Boolean)
      .join("/");

    await this.client.put(key, input.buffer, {
      headers: {
        "Content-Type": input.mimeType,
        "Content-Disposition": contentDisposition(input.originalFilename, input.mimeType)
      }
    });

    return {
      storageProvider: "oss",
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      storedFilename,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      sha256: sha256(input.buffer)
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

function contentDisposition(filename: string, mimeType: string): string {
  const encoded = encodeURIComponent(filename);
  const disposition = mimeType.startsWith("image/") ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encoded}`;
}
