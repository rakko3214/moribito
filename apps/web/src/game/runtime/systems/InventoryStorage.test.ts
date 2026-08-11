import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";

describe("Inventory storage", () => {
  it("deposits and withdraws a partial stack", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_wood", quantity: 5 });
    const inventory = new InventorySystem(() => state, vi.fn());
    expect(inventory.deposit("item_wood", 3)).toBe(true);
    expect(inventory.quantity("item_wood")).toBe(2); expect(inventory.storageQuantity("item_wood")).toBe(3);
    expect(inventory.withdraw("item_wood", 1)).toBe(true);
    expect(inventory.quantity("item_wood")).toBe(3); expect(inventory.storageQuantity("item_wood")).toBe(2);
  });
  it("does not move unavailable or invalid quantities", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn());
    expect(inventory.deposit("item_stone", 1)).toBe(false); expect(inventory.withdraw("item_stone", 0)).toBe(false);
    expect(state.inventory).toEqual({ items: [], storage: [] });
  });
});
