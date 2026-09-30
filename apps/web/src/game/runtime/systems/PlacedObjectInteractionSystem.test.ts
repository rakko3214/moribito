import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { LivestockSystem } from "./LivestockSystem.js";
import { PlacementSystem } from "./PlacementSystem.js";
import { PlacedObjectInteractionSystem } from "./PlacedObjectInteractionSystem.js";

describe("PlacedObjectInteractionSystem", () => {
  it("exposes sleep and workbench actions from movable furniture", () => {
    const state = createInitialState(); const changed = vi.fn(); const inventory = new InventorySystem(() => state, changed); const placement = new PlacementSystem(() => state, changed, inventory); const livestock = new LivestockSystem(() => state, changed, inventory); const system = new PlacedObjectInteractionSystem(placement, livestock);
    expect(system.describe({ id: "bed", itemId: "furniture_bed", x: 0, y: 0, rotation: 0 })).toMatchObject({ action: "sleep", label: "眠る" });
    expect(system.describe({ id: "bench", itemId: "furniture_workbench", x: 0, y: 0, rotation: 0 })).toMatchObject({ action: "workbench", label: "作業台を使う" });
  });
  it("persists a custom sign label and gate state", () => {
    const state = createInitialState(); const changed = vi.fn(); const inventory = new InventorySystem(() => state, changed); const placement = new PlacementSystem(() => state, changed, inventory); const livestock = new LivestockSystem(() => state, changed, inventory); const system = new PlacedObjectInteractionSystem(placement, livestock);
    state.world.maps.map_homestead = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [
      { id: "sign", itemId: "placeable_wooden_sign", x: 100, y: 400, rotation: 0 }, { id: "gate", itemId: "placeable_fence_gate", x: 142, y: 400, rotation: 0 },
    ] };
    system.interact("map_homestead", state.world.maps.map_homestead.placedObjects![0]!, "にわとり広場");
    system.interact("map_homestead", state.world.maps.map_homestead.placedObjects![1]!);
    expect(state.world.maps.map_homestead.placedObjects).toEqual(expect.arrayContaining([expect.objectContaining({ id: "sign", label: "にわとり広場" }), expect.objectContaining({ id: "gate", active: true })]));
  });
});
