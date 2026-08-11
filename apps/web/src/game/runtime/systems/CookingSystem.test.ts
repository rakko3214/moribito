import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { CookingSystem } from "./CookingSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("CookingSystem", () => {
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
});
