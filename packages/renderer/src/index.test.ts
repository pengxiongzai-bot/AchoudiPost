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

  it("renders images as links to the original asset", () => {
    const result = renderMarkdownArticle({
      slug: "image",
      title: "Image",
      markdown: "![screenshot](https://pic.example.com/a.png)",
      createdAt: "2026-07-02T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(result.html).toContain('class="article-image-link"');
    expect(result.html).toContain('href="https://pic.example.com/a.png"');
    expect(result.html).toContain('src="https://pic.example.com/a.png"');
  });

  it("keeps editor inline formatting while stripping unsafe attributes", () => {
    const result = renderMarkdownArticle({
      slug: "formatting",
      title: "Formatting",
      markdown:
        '<span class="fp-color-red fp-size-lg bad-class" onclick="alert(1)">Red text</span> and <u>underlined</u>',
      createdAt: "2026-07-02T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(result.html).toContain('<span class="fp-color-red fp-size-lg">Red text</span>');
    expect(result.html).toContain("<u>underlined</u>");
    expect(result.html).not.toContain("onclick");
    expect(result.html).not.toContain("bad-class");
  });
});
