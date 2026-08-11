import { describe, expect, it } from "vitest";
import { createInitialState } from "../game/runtime/initialState.js";
import { PendingSaveStore, type PendingSave, type PendingSaveDriver } from "./PendingSaveStore.js";

class MemoryDriver implements PendingSaveDriver {
  values = new Map<string, unknown>();
  async get(userId: string) { return this.values.get(userId); }
  async put(value: PendingSave) { this.values.set(value.userId, value); }
  async delete(userId: string) { this.values.delete(userId); }
}

describe("PendingSaveStore", () => {
  it("stores a validated snapshot per user and clears it", async () => {
    const driver = new MemoryDriver(); const store = new PendingSaveStore(driver); const save = createInitialState();
    await store.save("user-a", save); save.player.money = 999;
    const pending = await store.load("user-a");
    expect(pending).toMatchObject({ userId: "user-a", baseRevision: 0 });
    expect(pending?.saveData.player.money).not.toBe(999);
    await store.clear("user-a"); expect(await store.load("user-a")).toBeNull();
  });

  it("rejects malformed pending data", async () => {
    const driver = new MemoryDriver(); const store = new PendingSaveStore(driver);
    driver.values.set("user-a", { userId: "user-a", baseRevision: 0, createdAt: "now", saveData: {} });
    expect(await store.load("user-a")).toBeNull();
  });
});
