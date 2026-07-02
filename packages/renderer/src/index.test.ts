import { describe, expect, it } from "vitest";
import { renderMarkdownArticle } from "./index.js";

describe("renderMarkdownArticle", () => {
  it("generates toc and sanitized html", () => {
    const result = renderMarkdownArticle({
      slug: "hello",
      title: "Hello",
      markdown: "# 标题\n\n<script>alert(1)</script>\n\n```ts\nconsole.log('ok')\n```",
      createdAt: "2026-07-02T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(result.toc[0]?.text).toBe("标题");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("code-block");
  });
});
