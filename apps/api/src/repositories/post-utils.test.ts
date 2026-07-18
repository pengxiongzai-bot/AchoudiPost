import { describe, expect, it } from "vitest";
import { makePostSlug } from "./post-utils.js";

describe("makePostSlug", () => {
  it("creates title-independent URL-safe identifiers", () => {
    const slugs = Array.from({ length: 100 }, () => makePostSlug());

    expect(slugs.every((slug) => /^p_[A-Za-z0-9_-]{8}$/.test(slug))).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
