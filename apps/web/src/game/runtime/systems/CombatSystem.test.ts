import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { CombatSystem } from "./CombatSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("CombatSystem", () => {
  it("reduces corruption while contact damage is resolved separately", () => {
    const state = createInitialState(); const combat = new CombatSystem(vi.fn(), new InventorySystem(() => state, vi.fn()));
    combat.start(); combat.attack(); combat.attack();
    expect(combat.state.corruption).toBe(3); expect(combat.state.wards).toBe(3);
    combat.takeHit(); expect(combat.state.wards).toBe(2);
  });
  it("switches to purification and grants a clean reward", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); const combat = new CombatSystem(vi.fn(), inventory);
    combat.start(); for (let i = 0; i < 5; i += 1) combat.attack();
    expect(combat.state.status).toBe("purifiable"); expect(combat.cleanse()).toBe(true);
    expect(combat.state.status).toBe("cleansed"); expect(inventory.quantity("material_purified_fragment")).toBe(1);
  });
  it("uses cooking to restore one guardian slip", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "food_simmered_daikon", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const combat = new CombatSystem(vi.fn(), inventory);
    combat.start(); combat.takeHit(); expect(combat.useFood()).toBe(true);
    expect(combat.state.wards).toBe(3); expect(inventory.quantity("food_simmered_daikon")).toBe(0);
  });
  it("uses spirit and barrier durability to block a normal hit", () => {
    const state = createInitialState(); const combat = new CombatSystem(vi.fn(), new InventorySystem(() => state, vi.fn()));
    combat.start(); expect(combat.setBarrier(true)).toBe(true); combat.update(1000); combat.takeHit();
    expect(combat.state.wards).toBe(3); expect(combat.state.spirit).toBe(35); expect(combat.state.barrierDurability).toBe(2);
    combat.takeHit(true); expect(combat.state.wards).toBe(2);
  });
  it.each(["melee", "ranged", "charger"] as const)("starts a %s encounter", (enemyType) => {
    const state = createInitialState(); const combat = new CombatSystem(vi.fn(), new InventorySystem(() => state, vi.fn()));
    combat.start(enemyType); expect(combat.state).toMatchObject({ status: "battle", enemyType });
  });
});
