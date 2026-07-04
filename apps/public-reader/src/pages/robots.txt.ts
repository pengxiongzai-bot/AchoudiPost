import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, "") ?? "https://example.com";
  return new Response(["User-agent: *", "Allow: /", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
};
