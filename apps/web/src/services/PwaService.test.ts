import { describe, expect, it, vi } from "vitest";
import { clearMoribitoAppCache, isStandaloneDisplay, moribitoCacheNames, shouldRegisterServiceWorker, shouldSaveBeforeAppUpdate } from "./PwaService.js";

describe("PWA service policy", () => {
  it("does not unregister another application during cache recovery", async () => {
    const own = vi.fn(async () => true); const other = vi.fn(async () => true);
    const navigatorObject = { serviceWorker: { getRegistrations: async () => [
      { active: { scriptURL: "https://game.example/sw.js" }, unregister: own },
      { active: { scriptURL: "https://game.example/other/worker.js" }, unregister: other },
    ] } } as unknown as Navigator;
    const remove = vi.fn(async () => true);
    const cache = { keys: async () => ["moribito-shell-v2", "other-app"], delete: remove } as unknown as CacheStorage;
    await clearMoribitoAppCache(navigatorObject, cache);
    expect(own).toHaveBeenCalledOnce(); expect(other).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledExactlyOnceWith("moribito-shell-v2");
  });
  it("registers only for a secure production build with service worker support", () => {
    expect(shouldRegisterServiceWorker(true, true, true)).toBe(true);
    expect(shouldRegisterServiceWorker(false, true, true)).toBe(false);
    expect(shouldRegisterServiceWorker(true, false, true)).toBe(false);
    expect(shouldRegisterServiceWorker(true, true, false)).toBe(false);
  });
  it("recognizes browser and iOS standalone display modes", () => {
    expect(isStandaloneDisplay(true, false)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });
  it("waits for a real unsaved game before applying an update", () => {
    expect(shouldSaveBeforeAppUpdate(false, false, "dirty")).toBe(true);
    expect(shouldSaveBeforeAppUpdate(false, false, "error")).toBe(true);
    expect(shouldSaveBeforeAppUpdate(false, false, "saved")).toBe(false);
    expect(shouldSaveBeforeAppUpdate(false, true, "dirty")).toBe(false);
    expect(shouldSaveBeforeAppUpdate(true, false, "dirty")).toBe(false);
  });
  it("selects only Moribito application caches for recovery", () => {
    expect(moribitoCacheNames(["moribito-shell-v1", "other-app", "moribito-area-v2"])).toEqual(["moribito-shell-v1", "moribito-area-v2"]);
  });
});
