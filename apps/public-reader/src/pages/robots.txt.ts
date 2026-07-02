import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response(["User-agent: *", "Allow: /", "Sitemap: /sitemap.xml", ""].join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
