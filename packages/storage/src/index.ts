import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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
