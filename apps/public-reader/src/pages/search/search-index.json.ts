import type { APIRoute } from "astro";
import { buildSearchIndex } from "@freedompost/search";
import { articles, toSearchDocument } from "../../lib/articles";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex(articles.map(toSearchDocument))), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, stale-while-revalidate=600"
    }
  });
