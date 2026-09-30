import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";

describe("Inventory storage", () => {
  it("transfers a selected non-first stack without affecting other items", () => {
    const state = createInitialState();
    state.inventory.items.push({ itemId: "item_wood", quantity: 8 }, { itemId: "item_stone", quantity: 12 });
    state.inventory.storage.push({ itemId: "item_stone", quantity: 3 });
    const inventory = new InventorySystem(() => state, vi.fn());
    expect(inventory.deposit("item_stone", 12)).toBe(true);
    expect(inventory.storageQuantity("item_stone")).toBe(15);
    expect(inventory.quantity("item_wood")).toBe(8);
    expect(inventory.withdraw("item_stone", 15)).toBe(true);
    expect(inventory.quantity("item_stone")).toBe(15);
    expect(state.inventory.storage).toEqual([]);
  });
  it("keeps both stacks unchanged when the destination would overflow", () => {
    const state = createInitialState();
    state.inventory.items.push({ itemId: "item_wood", quantity: 2 });
    state.inventory.storage.push({ itemId: "item_wood", quantity: Number.MAX_SAFE_INTEGER });
    const before = structuredClone(state.inventory);
    expect(new InventorySystem(() => state, vi.fn()).deposit("item_wood", 2)).toBe(false);
    expect(state.inventory).toEqual(before);
  });
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
