import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { MemoryContentRepository } from "./repositories/index.js";

describe("api app", () => {
  it("serves health checks", async () => {
    const app = buildApp({ repository: new MemoryContentRepository() });
    const response = await app.inject({ method: "GET", url: "/health" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, service: "freedompost-api" });
  });

  it("records one view per visitor key per day", async () => {
    const app = buildApp({ repository: new MemoryContentRepository() });

    const first = await app.inject({
      method: "POST",
      url: "/api/posts/welcome/view",
      payload: { localId: "device-a" }
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/posts/welcome/view",
      payload: { localId: "device-a" }
    });
    await app.close();

    expect(first.statusCode).toBe(200);
    expect(first.json().counted).toBe(true);
    expect(second.json().counted).toBe(false);
  });
});
