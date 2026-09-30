import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { STAFF_STONES, StaffStoneSystem } from "./StaffStoneSystem.js";

describe("StaffStoneSystem", () => {
  it("crafts a stone from two stone materials and equips only one", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_stone", quantity: 4 });
    const inventory = new InventorySystem(() => state, vi.fn()); const system = new StaffStoneSystem(() => state, vi.fn(), inventory);
    expect(system.craft("stone_range")).toBe(true); expect(inventory.quantity("item_stone")).toBe(2);
    expect(system.equip("stone_range", true)).toBe(true); expect(system.equippedId).toBe("stone_range");
    expect(system.craft("stone_power")).toBe(true); expect(system.equip("stone_power", true)).toBe(true);
    expect(system.equippedId).toBe("stone_power"); expect(inventory.quantity("stone_range")).toBe(1);
  });
  it("does not change stones during combat", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "stone_range", quantity: 1 });
    const system = new StaffStoneSystem(() => state, vi.fn(), new InventorySystem(() => state, vi.fn()));
    expect(system.equip("stone_range", false)).toBe(false); expect(system.equippedId).toBeUndefined();
  });
  it("defines visibly different attack profiles", () => {
    expect(STAFF_STONES.stone_power.damage).toBeGreaterThan(STAFF_STONES.stone_range.damage);
    expect(STAFF_STONES.stone_range.range).toBeGreaterThan(STAFF_STONES.stone_power.range);
    expect(new Set(Object.values(STAFF_STONES).map((stone) => stone.color)).size).toBe(6);
  });
});
