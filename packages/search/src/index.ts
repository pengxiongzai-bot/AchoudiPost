import type { SearchDocument, SearchIndexPayload } from "@freedompost/shared";

export interface WeightedSearchResult extends SearchDocument {
  source: "title" | "body";
  score: number;
}

export function buildSearchIndex(documents: SearchDocument[]): SearchIndexPayload {
  return {
    version: String(Date.now()),
    engine: "local-weighted",
    documents
  };
}

export function searchDocuments(query: string, documents: SearchDocument[]): WeightedSearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const seen = new Map<string, WeightedSearchResult>();

  for (const document of documents) {
    const title = normalize(document.title);
    const body = normalize(document.body);
    const titleIndex = title.indexOf(normalizedQuery);
    const bodyIndex = body.indexOf(normalizedQuery);

    if (titleIndex >= 0) {
      seen.set(document.slug, {
        ...document,
        source: "title",
        score: 1000 - titleIndex
      });
      continue;
    }

    if (bodyIndex >= 0) {
      seen.set(document.slug, {
        ...document,
        source: "body",
        score: 100 - Math.min(bodyIndex, 99)
      });
    }
  }

  return [...seen.values()].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}
