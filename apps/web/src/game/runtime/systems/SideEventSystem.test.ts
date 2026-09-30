import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { SIDE_EVENTS, SideEventSystem } from "./SideEventSystem.js";

describe("SideEventSystem", () => {
  it("defines six optional events across chapters one to three", () => {
    expect(SIDE_EVENTS).toHaveLength(6);
    expect(new Set(SIDE_EVENTS.map((event) => event.chapter))).toEqual(new Set([1, 2, 3]));
    expect(new Set(SIDE_EVENTS.map((event) => event.npcId)).size).toBe(6);
  });
  it("shows chapter-appropriate events and their material progress", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_daikon", quantity: 1 });
    const system = new SideEventSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.forNpc("shiki")[0]).toMatchObject({ id: "side_shiki_first_harvest", ready: true, current: 1 });
    expect(system.forNpc("genzo")).toHaveLength(0);
  });
  it("consumes the item, rewards money and friendship exactly once", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_daikon", quantity: 1 });
    const changed = vi.fn(); const inventory = new InventorySystem(() => state, changed); const system = new SideEventSystem(() => state, changed, inventory);
    expect(system.complete("side_shiki_first_harvest")?.reward).toBe(80);
    expect(inventory.quantity("item_daikon")).toBe(0); expect(state.player.money).toBe(580); expect(state.npcs.states.shiki?.friendship).toBe(3);
    expect(system.complete("side_shiki_first_harvest")).toBeUndefined(); expect(state.player.money).toBe(580);
  });
  it("preserves later events until their chapter and reports completion", () => {
    const state = createInitialState(); const system = new SideEventSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.complete("side_yota_guiding_acorn")).toBeUndefined();
    state.progression.chapter = 3; state.inventory.items.push({ itemId: "item_spirit_acorn", quantity: 1 });
    expect(system.complete("side_yota_guiding_acorn")?.npcId).toBe("yota"); expect(system.summary).toBe("サブイベント 1/6");
  });
});
