import { describe, expect, it, vi } from "vitest";
import { saveDataV1Schema } from "@moribito/shared";
import { createInitialState } from "../initialState.js";
import { ALCHEMY_RECIPES, AlchemySystem, type AlchemyRecipeId } from "./AlchemySystem.js";
import { InventorySystem } from "./InventorySystem.js";

function setup(id: AlchemyRecipeId) {
  const state = createInitialState();
  const inventory = new InventorySystem(() => state, vi.fn());
  for (const item of ALCHEMY_RECIPES[id].ingredients) inventory.add(item.itemId, item.quantity);
  return { state, inventory, alchemy: new AlchemySystem(() => state, vi.fn(), inventory) };
}
describe("alchemy result and save flow", () => {
  it.each(Object.keys(ALCHEMY_RECIPES) as AlchemyRecipeId[])("retains %s output after save round-trip", (id) => {
    const { state, alchemy } = setup(id);
    expect(alchemy.craft(2, undefined, id)).toBe(true);
    expect(alchemy.craft(2, undefined, id)).toBe(false);
    const restored = saveDataV1Schema.parse(JSON.parse(JSON.stringify(state)));
    expect(restored.inventory.items).toContainEqual({ itemId: ALCHEMY_RECIPES[id].resultItemId, quantity: 2 });
    for (const item of ALCHEMY_RECIPES[id].ingredients) expect(restored.inventory.items.some((stack) => stack.itemId === item.itemId)).toBe(false);
  });
  it("failure creates only the unified crude product", () => {
    const { alchemy, inventory } = setup("purification");
    expect(alchemy.craft(1, "item_crude_product", "purification")).toBe(true);
    expect(inventory.quantity("item_crude_product")).toBe(1);
    expect(inventory.quantity("medicine_purifying")).toBe(0);
  });
  it("preserves ingredients when the result stack cannot be represented", () => {
    const { state, alchemy } = setup("healing");
    state.inventory.items.push({ itemId: "medicine_healing", quantity: Number.MAX_SAFE_INTEGER });
    const before = structuredClone(state);
    expect(alchemy.craft()).toBe(false);
    expect(state).toEqual(before);
  });
  it.each([NaN, Infinity, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid output %s before consuming ingredients", (quantity) => {
    const { state, alchemy } = setup("healing"); const before = structuredClone(state);
    expect(alchemy.craft(quantity)).toBe(false);
    expect(state).toEqual(before);
  });
});
