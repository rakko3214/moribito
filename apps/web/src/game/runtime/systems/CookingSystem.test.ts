import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { COOKING_RECIPES, CookingSystem, cookedRecipeFlag } from "./CookingSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("CookingSystem", () => {
  it("requires a successful handmade dish before automatic cooking and preserves mastery on reload", () => {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, vi.fn());
    const cooking = new CookingSystem(() => state, vi.fn(), inventory);
    inventory.add("item_daikon", 3);
    expect(cooking.cookAutomatically("simmered_daikon")).toBe(false);
    expect(inventory.quantity("item_daikon")).toBe(3);
    expect(cooking.cook("simmered_daikon", "food_failed_dish")).toBe(true);
    expect(cooking.hasCompleted("simmered_daikon")).toBe(false);
    expect(cooking.cook("simmered_daikon")).toBe(true);
    const saved = structuredClone(state);
    const restoredInventory = new InventorySystem(() => saved, vi.fn());
    const restored = new CookingSystem(() => saved, vi.fn(), restoredInventory);
    expect(restored.cookAutomatically("simmered_daikon")).toBe(true);
    expect(restoredInventory.quantity("food_simmered_daikon")).toBe(2);
    expect(restoredInventory.quantity("item_daikon")).toBe(0);
    expect(restored.cookAutomatically("simmered_daikon")).toBe(false);
    expect(saved.events.flags.filter((flag) => flag === cookedRecipeFlag("simmered_daikon"))).toHaveLength(1);
  });
  it("consumes ingredients and creates a dish", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_daikon", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn());
    const cooking = new CookingSystem(() => state, vi.fn(), inventory);
    expect(cooking.cook("simmered_daikon")).toBe(true);
    expect(inventory.quantity("item_daikon")).toBe(0);
    expect(inventory.quantity("food_simmered_daikon")).toBe(1);
  });
  it("does not cook without ingredients", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn());
    expect(new CookingSystem(() => state, vi.fn(), inventory).cook("herb_rice")).toBe(false);
  });
  it("creates a failed dish while still consuming ingredients", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_daikon", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn());
    expect(new CookingSystem(() => state, vi.fn(), inventory).cook("simmered_daikon", "food_failed_dish")).toBe(true);
    expect(inventory.quantity("item_daikon")).toBe(0);
    expect(inventory.quantity("food_failed_dish")).toBe(1);
  });
  it("defines and cooks eight recipes through two reusable methods", () => {
    expect(Object.keys(COOKING_RECIPES)).toHaveLength(8);
    expect(new Set(Object.values(COOKING_RECIPES).map((recipe) => recipe.method))).toEqual(new Set(["heat", "rice"]));
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_rice", quantity: 1 }, { itemId: "item_carrot", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const cooking = new CookingSystem(() => state, vi.fn(), inventory);
    expect(cooking.cook("mixed_rice")).toBe(true); expect(inventory.quantity("food_mixed_rice")).toBe(1);
  });
  it("uses a stable completion flag for saved recipe mastery", () => {
    expect(cookedRecipeFlag("herb_rice")).toBe("cooking:completed:herb_rice");
  });
});
