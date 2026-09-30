import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ConstructionSystem } from "./ConstructionSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("ConstructionSystem", () => {
  it("pays money and materials and creates a placeable building contract", () => {
    const state = createInitialState(); state.player.money = 1000;
    state.inventory.items.push({ itemId: "item_wood", quantity: 20 }, { itemId: "item_stone", quantity: 10 });
    const changed = vi.fn(); const inventory = new InventorySystem(() => state, changed); const system = new ConstructionSystem(() => state, changed, inventory);
    expect(system.order("house_upgrade_1")).toBe(true);
    expect(state.player.money).toBe(500); expect(inventory.quantity("item_wood")).toBe(0); expect(system.homeUpgradeStage()).toBe(1);
    expect(system.order("house_upgrade_1")).toBe(false);
  });

  it("requires the first upgrade before the final home upgrade", () => {
    const state = createInitialState(); state.player.money = 5000;
    state.inventory.items.push({ itemId: "item_wood", quantity: 100 }, { itemId: "item_stone", quantity: 100 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new ConstructionSystem(() => state, vi.fn(), inventory);
    expect(system.availability("house_upgrade_2")).toEqual({ canOrder: false, reason: "prerequisite" });
    expect(system.order("house_upgrade_1")).toBe(true);
    expect(system.order("house_upgrade_2")).toBe(true);
    expect(system.homeUpgradeStage()).toBe(2);
  });

  it("reports why a construction request is unavailable", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); const system = new ConstructionSystem(() => state, vi.fn(), inventory);
    expect(system.availability("house_upgrade_1")).toEqual({ canOrder: false, reason: "materials" });
    state.player.money = 0;
    expect(system.availability("house_upgrade_1")).toEqual({ canOrder: false, reason: "money" });
  });

  it("does not consume anything when requirements are missing", () => {
    const state = createInitialState(); state.player.money = 1000; state.inventory.items.push({ itemId: "item_wood", quantity: 3 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new ConstructionSystem(() => state, vi.fn(), inventory);
    expect(system.order("chicken_coop")).toBe(false); expect(state.player.money).toBe(1000); expect(inventory.quantity("item_wood")).toBe(3);
  });

  it("keeps the first chicken coop within the starting homestead resource budget", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_wood", quantity: 16 }, { itemId: "item_stone", quantity: 8 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new ConstructionSystem(() => state, vi.fn(), inventory);
    expect(system.order("chicken_coop")).toBe(true); expect(state.player.money).toBe(250); expect(inventory.quantity("item_wood")).toBe(4); expect(inventory.quantity("item_stone")).toBe(4);
  });
});
