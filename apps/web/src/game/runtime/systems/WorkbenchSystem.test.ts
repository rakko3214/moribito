import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { WorkbenchSystem } from "./WorkbenchSystem.js";

describe("WorkbenchSystem", () => {
  it("only lists unlocked recipes and filters by category", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); const system = new WorkbenchSystem(() => state, vi.fn(), inventory);
    system.unlock("wooden_chair"); system.unlock("livestock_fence");
    expect(system.list({ category: "furniture" }).map(([id]) => id)).toEqual(["wooden_chair"]);
  });
  it("searches by recipe and material name", () => {
    const state = createInitialState(); const system = new WorkbenchSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    system.unlock("wooden_chair"); system.unlock("water_trough");
    expect(system.list({ query: "木材" }).map(([id]) => id)).toEqual(["wooden_chair"]);
  });
  it("consumes materials and creates the selected quantity", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_wood", quantity: 6 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new WorkbenchSystem(() => state, vi.fn(), inventory); system.unlock("livestock_fence");
    expect(system.craft("livestock_fence", 3)).toBe(true); expect(inventory.quantity("placeable_livestock_fence")).toBe(3); expect(inventory.quantity("item_wood")).toBe(0);
  });
  it("supports a craftable-only filter", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_wood", quantity: 3 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new WorkbenchSystem(() => state, vi.fn(), inventory); system.unlock("wooden_chair"); system.unlock("wooden_table");
    expect(system.list({ craftableOnly: true }).map(([id]) => id)).toEqual(["wooden_chair"]);
  });
  it("sells a furniture recipe once and unlocks it for the workbench", () => {
    const state = createInitialState(); state.player.money = 300;
    const system = new WorkbenchSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.purchaseRecipe("wooden_table")).toBe(true);
    expect(state.player.money).toBe(180);
    expect(system.isUnlocked("wooden_table")).toBe(true);
    expect(system.purchaseRecipe("wooden_table")).toBe(false);
    expect(state.player.money).toBe(180);
  });
  it("requires a livestock building before selling trough recipes", () => {
    const state = createInitialState(); state.player.money = 500;
    const system = new WorkbenchSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.recipePurchaseAvailability("feed_trough")).toEqual({ canPurchase: false, reason: "prerequisite" });
    state.events.flags.push("construction:ordered:chicken_coop");
    expect(system.purchaseRecipe("feed_trough")).toBe(true);
    expect(state.player.money).toBe(360);
  });
  it("does not sell recipes when money is insufficient", () => {
    const state = createInitialState(); state.player.money = 100;
    const system = new WorkbenchSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.recipePurchaseAvailability("storage_box")).toEqual({ canPurchase: false, reason: "money" });
    expect(system.purchaseRecipe("storage_box")).toBe(false);
    expect(state.player.money).toBe(100);
  });
});
