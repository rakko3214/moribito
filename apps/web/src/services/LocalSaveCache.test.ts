import { describe, expect, it } from "vitest";
import { createInitialState } from "../game/runtime/initialState.js";
import { LocalSaveCache, type SaveCacheStorage } from "./LocalSaveCache.js";

class MemoryStorage implements SaveCacheStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("LocalSaveCache", () => {
  it("keeps an independent validated snapshot per user", () => {
    const storage = new MemoryStorage(); const cache = new LocalSaveCache(storage); const save = createInitialState();
    save.player.money = 320; cache.save("user-a", save); save.player.money = 999;
    expect(cache.load("user-a")?.player.money).toBe(320); expect(cache.load("user-b")).toBeNull();
  });

  it("ignores corrupted cached data and can clear a user", () => {
    const storage = new MemoryStorage(); const cache = new LocalSaveCache(storage);
    storage.setItem("moribito.save-cache.user-a", "{broken"); expect(cache.load("user-a")).toBeNull();
    cache.save("user-a", createInitialState()); cache.clear("user-a"); expect(cache.load("user-a")).toBeNull();
  });

  it("keeps cloud save flow alive when browser storage rejects writes", () => {
    const storage: SaveCacheStorage = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("blocked"); } };
    const cache = new LocalSaveCache(storage);
    expect(cache.save("user-a", createInitialState())).toBe(false);
    expect(cache.clear("user-a")).toBe(false);
  });
});
