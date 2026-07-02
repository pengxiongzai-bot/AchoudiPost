import type { APIRoute } from "astro";
import { articles, findArticle } from "../../../lib/articles";

export function getStaticPaths() {
  return articles.map((article) => ({
    params: { slug: article.slug }
  }));
}

export const GET: APIRoute = ({ params }) => {
  const article = findArticle(params.slug ?? "");

  if (!article) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(JSON.stringify(article.meta), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, stale-while-revalidate=600"
    }
  });
};
