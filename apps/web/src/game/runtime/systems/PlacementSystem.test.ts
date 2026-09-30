import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { PlacementSystem } from "./PlacementSystem.js";

describe("PlacementSystem", () => {
  it("places a carpenter-built large building on the homestead grid", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "building_chicken_coop", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    const placed = system.place("map_homestead", "building_chicken_coop", 294, 462, 0);
    expect(placed).toMatchObject({ itemId: "building_chicken_coop", x: 294, y: 462 });
    expect(system.canPlace("map_homestead", "placeable_livestock_fence", 294, 462, 0)).toBe(false);
  });
  it("snaps placement to the construction grid and persists it", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "placeable_livestock_fence", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    const placed = system.place("map_homestead", "placeable_livestock_fence", 151, 367, 0);
    expect(placed).toMatchObject({ x: 168, y: 378, rotation: 0 }); expect(inventory.quantity("placeable_livestock_fence")).toBe(0);
  });
  it("rejects wrong maps, overlaps and blocked areas", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "furniture_wooden_chair", quantity: 1 }, { itemId: "placeable_livestock_fence", quantity: 2 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    expect(system.place("map_homestead", "furniture_wooden_chair", 168, 378, 0)).toBeUndefined();
    expect(system.place("map_homestead", "placeable_livestock_fence", 168, 378, 0)).toBeDefined();
    expect(system.canPlace("map_homestead", "placeable_livestock_fence", 168, 378, 0)).toBe(false);
    expect(system.canPlace("map_homestead", "placeable_livestock_fence", 210, 378, 0, [{ x: 189, y: 357, width: 42, height: 42 }])).toBe(false);
  });
  it("rotates and recovers a placed object", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "placeable_fence_gate", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    const placed = system.place("map_homestead", "placeable_fence_gate", 168, 378, system.rotate(0));
    expect(placed?.rotation).toBe(90); expect(system.recover("map_homestead", placed?.id ?? "")).toBe(true); expect(inventory.quantity("placeable_fence_gate")).toBe(1);
  });
  it("lets the player recover and reposition essential home furniture", () => {
    const state = createInitialState();
    state.world.maps.map_home = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [{ id: "bed", itemId: "furniture_bed", x: 126, y: 168, rotation: 0 }] };
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    expect(system.recover("map_home", "bed")).toBe(true);
    expect(inventory.quantity("furniture_bed")).toBe(1);
    expect(system.place("map_home", "furniture_bed", 252, 252, 90)).toMatchObject({ itemId: "furniture_bed", x: 252, y: 252, rotation: 90 });
  });
  it("moves furniture directly while ignoring its original footprint", () => {
    const state = createInitialState();
    state.world.maps.map_home = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [
      { id: "bed", itemId: "furniture_bed", x: 126, y: 168, rotation: 0 },
      { id: "bench", itemId: "furniture_workbench", x: 336, y: 168, rotation: 0 },
    ] };
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    expect(system.move("map_home", "bed", 126, 168, 90)).toMatchObject({ x: 126, y: 168, rotation: 90 });
    expect(system.move("map_home", "bed", 336, 168, 0)).toBeUndefined();
    expect(system.move("map_home", "bed", 252, 252, 0)).toMatchObject({ x: 252, y: 252, rotation: 0 });
    expect(inventory.quantity("furniture_bed")).toBe(0);
  });
  it("expands the indoor furniture limit with the player home", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "furniture_wooden_chair", quantity: 1 });
    state.world.maps.map_home = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: Array.from({ length: 6 }, (_, index) => ({ id: `old-${index}`, itemId: "furniture_wooden_chair", x: -100 - index * 42, y: -100, rotation: 0 })) };
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    expect(system.placementLimit("map_home")).toBe(6);
    expect(system.canPlace("map_home", "furniture_wooden_chair", 252, 252, 0)).toBe(false);
    state.events.flags.push("construction:ordered:house_upgrade_1");
    expect(system.placementLimit("map_home")).toBe(12);
    expect(system.canPlace("map_home", "furniture_wooden_chair", 252, 252, 0)).toBe(true);
  });
  it("expands the indoor placement bounds with each home stage", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); const system = new PlacementSystem(() => state, vi.fn(), inventory);
    expect(system.canPlace("map_home", "furniture_wooden_chair", 84, 126, 0)).toBe(false);
    state.events.flags.push("construction:ordered:house_upgrade_1");
    expect(system.canPlace("map_home", "furniture_wooden_chair", 84, 126, 0)).toBe(true);
    expect(system.canPlace("map_home", "furniture_wooden_chair", 63, 126, 0)).toBe(false);
    state.events.flags.push("construction:ordered:house_upgrade_2");
    expect(system.canPlace("map_home", "furniture_wooden_chair", 63, 126, 0)).toBe(true);
  });
});
