import { describe, expect, it } from "vitest";
import { isAllowedUpload, sanitizeCommentText } from "./index.js";

describe("security helpers", () => {
  it("strips comment HTML", () => {
    expect(sanitizeCommentText("<img src=x onerror=alert(1)>hello")).toBe("hello");
  });

  it("requires both extension and MIME family for uploads", () => {
    expect(isAllowedUpload("note.md", "text/markdown")).toBe(true);
    expect(isAllowedUpload("note.exe", "text/plain")).toBe(false);
  });
});
