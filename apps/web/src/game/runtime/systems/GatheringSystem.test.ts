import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { GatheringSystem } from "./GatheringSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("GatheringSystem", () => {
  it("collects a node once and stores its world state", () => {
    const state = createInitialState();
    const changed = vi.fn();
    const inventory = new InventorySystem(() => state, changed);
    const gathering = new GatheringSystem(() => state, changed, inventory);

    expect(gathering.collect("map_village", "herb_1", "item_yomogi", 2)).toBe(true);
    expect(inventory.quantity("item_yomogi")).toBe(2);
    expect(state.world.maps.map_village?.collectedObjects).toEqual(["herb_1"]);
    expect(gathering.collect("map_village", "herb_1", "item_yomogi", 2)).toBe(false);
    expect(inventory.quantity("item_yomogi")).toBe(2);
  });

  it("tracks the same node id independently on different maps", () => {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, vi.fn());
    const gathering = new GatheringSystem(() => state, vi.fn(), inventory);

    expect(gathering.collect("map_village", "stone_1", "item_stone")).toBe(true);
    expect(gathering.collect("map_shrine", "stone_1", "item_stone")).toBe(true);
    expect(inventory.quantity("item_stone")).toBe(2);
  });

  it("respawns renewable resources next day but preserves story clues", () => {
    const state = createInitialState(); const changed = vi.fn();
    const gathering = new GatheringSystem(() => state, changed, new InventorySystem(() => state, changed));
    gathering.collect("map_village", "herb_1", "item_yomogi");
    gathering.collect("map_forest", "clue_1", "clue_yota_footprint");
    expect(gathering.advanceDay()).toBe(true);
    expect(gathering.isCollected("map_village", "herb_1")).toBe(false);
    expect(gathering.isCollected("map_forest", "clue_1")).toBe(true);
  });
});
