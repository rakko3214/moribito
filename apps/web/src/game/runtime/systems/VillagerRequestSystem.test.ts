import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { VillagerRequestSystem } from "./VillagerRequestSystem.js";

describe("VillagerRequestSystem", () => {
  it("starts requests only once", () => {
    const state = createInitialState(); const requests = new VillagerRequestSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(requests.ensureStarted()).toBe(true); expect(requests.ensureStarted()).toBe(false); expect(state.quests.active).toHaveLength(2);
  });
  it("consumes delivery items, records completion and pays money", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_daikon", quantity: 2 });
    const inventory = new InventorySystem(() => state, vi.fn()); const requests = new VillagerRequestSystem(() => state, vi.fn(), inventory); requests.ensureStarted();
    expect(requests.deliverTo("kaede")).toMatchObject({ reward: 120 });
    expect(inventory.quantity("item_daikon")).toBe(0); expect(state.player.money).toBe(620); expect(state.quests.completedIds).toContain("request_kaede_daikon");
  });
  it("does not complete a request without enough items", () => {
    const state = createInitialState(); const requests = new VillagerRequestSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn())); requests.ensureStarted();
    expect(requests.deliverTo("tessai")).toBeUndefined(); expect(state.player.money).toBe(500);
  });
});
