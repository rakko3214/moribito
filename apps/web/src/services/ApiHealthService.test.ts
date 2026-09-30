import { describe, expect, it, vi } from "vitest";
import { checkApiHealth } from "./ApiHealthService.js";

describe("API health service", () => {
  it("reports version, storage and response time for a healthy API", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", storage: "file", apiVersion: "0.1.0", schemaVersion: 1 }) });
    const times = [100, 142];
    const result = await checkApiHealth("http://localhost:3001", fetcher, 2500, () => times.shift() ?? 142);
    expect(fetcher).toHaveBeenCalledWith("http://localhost:3001/health", expect.objectContaining({ cache: "no-store" }));
    expect(result).toMatchObject({ status: "available", latencyMs: 42, storage: "file", apiVersion: "0.1.0", schemaVersion: 1 });
  });
  it("reports unavailable without exposing transport errors", async () => {
    const result = await checkApiHealth("http://localhost:3001", vi.fn().mockRejectedValue(new Error("connection refused")));
    expect(result).toMatchObject({ status: "unavailable", latencyMs: null, storage: null });
  });
  it("rejects malformed health responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "starting" }) });
    expect(await checkApiHealth("http://localhost:3001", fetcher)).toMatchObject({ status: "unavailable" });
  });
});
