import { PostgresContentRepository } from "./postgres.js";
import { MemoryContentRepository } from "./memory.js";
import type { ContentRepository } from "./types.js";

export function createContentRepository(): ContentRepository {
  if (process.env.DATABASE_URL && process.env.FREEDOMPOST_REPOSITORY !== "memory") {
    return new PostgresContentRepository(process.env.DATABASE_URL);
  }

  return new MemoryContentRepository();
}

export { MemoryContentRepository, PostgresContentRepository };
export type * from "./types.js";
