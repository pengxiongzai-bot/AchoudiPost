import type { APIRoute } from "astro";
import { articles, toPostListItem } from "../../lib/articles";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(articles.map(toPostListItem)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, stale-while-revalidate=600"
    }
  });
