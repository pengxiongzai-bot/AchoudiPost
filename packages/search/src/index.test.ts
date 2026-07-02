import { describe, expect, it } from "vitest";
import { searchDocuments } from "./index.js";

const docs = [
  {
    id: "1",
    slug: "body-only",
    title: "部署手记",
    body: "这里提到了搜索功能",
    excerpt: "",
    updatedAt: "2026-07-01"
  },
  {
    id: "2",
    slug: "title-hit",
    title: "搜索设计",
    body: "正文",
    excerpt: "",
    updatedAt: "2026-07-02"
  }
];

describe("searchDocuments", () => {
  it("prioritizes title matches over body matches", () => {
    expect(searchDocuments("搜索", docs).map((item) => item.slug)).toEqual([
      "title-hit",
      "body-only"
    ]);
  });
});
