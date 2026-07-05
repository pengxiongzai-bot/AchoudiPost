import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { LocalStorageAdapter } from "./index.js";

describe("storage adapters", () => {
  it("stores non-image files with a 5 character alphanumeric filename", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "freedompost-storage-"));

    try {
      const storage = new LocalStorageAdapter(root, "/uploads");
      const stored = await storage.putObject({
        buffer: Buffer.from("hello"),
        originalFilename: "Koala.Clash_x64-setup.exe",
        mimeType: "application/x-msdownload",
        namespace: "admin"
      });

      expect(stored.originalFilename).toBe("Koala.Clash_x64-setup.exe");
      expect(stored.storedFilename).toMatch(/^[0-9A-Za-z]{5}\.exe$/);
      expect(stored.storageKey).toMatch(/^admin\/\d{4}\/\d{2}\/\d{2}\/[0-9A-Za-z]{5}\.exe$/);
      expect(stored.publicUrl).toMatch(/\/admin\/\d{4}\/\d{2}\/\d{2}\/[0-9A-Za-z]{5}\.exe$/);
      expect(stored.mimeType).toBe("application/x-msdownload");
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("converts uploaded images to compressed webp files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "freedompost-storage-"));

    try {
      const storage = new LocalStorageAdapter(root, "/uploads");
      const png = await sharp({
        create: {
          width: 320,
          height: 240,
          channels: 3,
          background: "#d3342f"
        }
      })
        .png()
        .toBuffer();

      const stored = await storage.putObject({
        buffer: png,
        originalFilename: "cover.png",
        mimeType: "image/png",
        namespace: "admin"
      });

      expect(stored.originalFilename).toBe("cover.png");
      expect(stored.storedFilename).toMatch(/^[0-9A-Za-z]{5}\.webp$/);
      expect(stored.storageKey).toMatch(/^admin\/\d{4}\/\d{2}\/\d{2}\/[0-9A-Za-z]{5}\.webp$/);
      expect(stored.mimeType).toBe("image/webp");

      const saved = await readFile(path.join(root, stored.storageKey));
      const metadata = await sharp(saved).metadata();

      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(320);
      expect(metadata.height).toBe(240);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
