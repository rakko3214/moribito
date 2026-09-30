import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { GATHERING_MATERIALS, GatheringSystem } from "./GatheringSystem.js";
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

  it("keeps cleared homestead obstacles destroyed across days", () => {
    const state = createInitialState(); const changed = vi.fn();
    const inventory = new InventorySystem(() => state, changed);
    const gathering = new GatheringSystem(() => state, changed, inventory);
    expect(gathering.destroy("map_homestead", "wood_1", "item_wood", 3)).toBe(true);
    expect(gathering.destroy("map_homestead", "wood_1", "item_wood", 3)).toBe(false);
    gathering.advanceDay();
    expect(gathering.isDestroyed("map_homestead", "wood_1")).toBe(true);
    expect(inventory.quantity("item_wood")).toBe(3);
  });

  it("defines eight gathering materials with distinct habitats and uses", () => {
    expect(Object.keys(GATHERING_MATERIALS)).toHaveLength(8);
    expect(new Set(Object.values(GATHERING_MATERIALS).map((material) => material.habitat))).toEqual(new Set(["homestead", "forest", "river"]));
    expect(Object.values(GATHERING_MATERIALS).every((material) => material.use.length > 0)).toBe(true);
  });

  it("respawns catalogued renewable materials without relying on node prefixes", () => {
    const state = createInitialState(); const changed = vi.fn();
    const inventory = new InventorySystem(() => state, changed);
    const gathering = new GatheringSystem(() => state, changed, inventory);
    expect(gathering.collect("map_forest_depths", "daily-special", "item_mushroom", 2)).toBe(true);
    expect(state.world.maps.map_forest_depths?.flags).toContain("gathered:daily-special:item_mushroom");
    gathering.advanceDay();
    expect(gathering.isCollected("map_forest_depths", "daily-special")).toBe(false);
    expect(state.world.maps.map_forest_depths?.flags).not.toContain("gathered:daily-special:item_mushroom");
  });
});
