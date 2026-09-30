import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
function worker(response: Response, quotaFailure = false) {
  const listeners = new Map<string, (event: unknown) => void>();
  const put = vi.fn(async () => { if (quotaFailure) throw new Error("quota"); });
  const fetchMock = vi.fn(async () => response);
  const addAll = vi.fn(async () => { if (quotaFailure) throw new Error("quota"); });
  runInNewContext(source, {
    self: { location: { origin: "https://game.example" }, addEventListener: (name: string, handler: (event: unknown) => void) => listeners.set(name, handler) },
    URL, Response, fetch: fetchMock,
    caches: { open: async () => ({ put, addAll, match: async () => new Response("saved shell") }), match: async () => new Response("saved shell") },
  });
  const request = (path: string, mode = "navigate") => {
    const respondWith = vi.fn();
    listeners.get("fetch")!({ request: { url: `https://game.example${path}`, method: "GET", mode }, respondWith });
    return respondWith;
  };
  const install = () => {
    const waitUntil = vi.fn(); listeners.get("install")!({ waitUntil });
    return waitUntil.mock.calls[0]![0] as Promise<void>;
  };
  return { put, fetchMock, request, install, addAll };
}

describe("production service worker", () => {
  it("waits for all shell files before completing installation", async () => {
    const context = worker(new Response("online"));
    await context.install();
    expect(context.addAll).toHaveBeenCalledWith(["/", "/manifest.webmanifest", "/app-icon.svg"]);
  });
  it("fails installation rather than claiming offline readiness on quota errors", async () => {
    const context = worker(new Response("online"), true);
    await expect(context.install()).rejects.toThrow("quota");
  });
  it("keeps the last working shell when the host returns an error", async () => {
    const context = worker(new Response("unavailable", { status: 503 }));
    const result = await context.request("/").mock.calls[0]![0] as Response;
    expect(await result.text()).toBe("saved shell");
    expect(context.put).not.toHaveBeenCalled();
    expect(context.fetchMock).not.toHaveBeenCalled();
  });
  it("serves online content even when the cache is full", async () => {
    const context = worker(new Response("online"), true);
    const result = await context.request("/uncached.png", "cors").mock.calls[0]![0] as Response;
    expect(await result.text()).toBe("online");
  });
  it("does not intercept private API requests", () => {
    const context = worker(new Response("private"));
    expect(context.request("/api/save", "cors")).not.toHaveBeenCalled();
    expect(context.fetchMock).not.toHaveBeenCalled();
  });
  it("uses the installed version of precached assets without networking", async () => {
    const context = worker(new Response("new incompatible icon"));
    const result = await context.request("/app-icon.svg", "cors").mock.calls[0]![0] as Response;
    expect(await result.text()).toBe("saved shell");
    expect(context.fetchMock).not.toHaveBeenCalled();
  });
});
