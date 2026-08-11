import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { YodomiTreeBossSystem } from "./YodomiTreeBossSystem.js";

function setup() { const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); return { inventory, boss: new YodomiTreeBossSystem(vi.fn(), inventory) }; }
describe("YodomiTreeBossSystem", () => {
  it("changes from basic attacks to target judgment and safe zones", () => {
    const { boss } = setup(); boss.start(); expect(boss.prepareNextAttack()?.kind).toBe("normal"); boss.resolvePreparedAttack(true, false, false);
    for (let i = 0; i < 5; i += 1) boss.attack(); expect(boss.phase).toBe(2); expect(boss.prepareNextAttack()?.kind).toBe("piercing"); boss.resolvePreparedAttack(true, false, false);
    boss.prepareNextAttack(); expect(boss.currentAttack?.kind).toBe("enclosure"); expect(boss.attack("tree")).toBe(false); expect(boss.attack("root")).toBe(true);
    for (let i = 0; i < 5; i += 1) boss.attack(); expect(boss.phase).toBe(3); expect(boss.prepareNextAttack()?.kind).toBe("safe_zone");
  });
  it("applies the correct defense language for each attack type", () => {
    const { boss } = setup(); boss.start(); boss.prepareNextAttack(); boss.resolvePreparedAttack(false, true, false); expect(boss.wards).toBe(4);
    for (let i = 0; i < 5; i += 1) boss.attack(); boss.prepareNextAttack(); boss.resolvePreparedAttack(false, true, false); expect(boss.wards).toBe(3);
    while (boss.phase !== 3) { if (boss.currentAttack?.kind === "enclosure") boss.attack("root"); else if (boss.currentAttack) boss.resolvePreparedAttack(true, false, false); else boss.attack(); }
    boss.prepareNextAttack(); boss.resolvePreparedAttack(true, true, false); expect(boss.wards).toBe(2);
    boss.prepareNextAttack(); boss.resolvePreparedAttack(false, false, true); expect(boss.wards).toBe(2);
  });
  it("purifies without killing the tree and grants forest materials", () => {
    const { boss, inventory } = setup(); boss.start(); for (let i = 0; i < 15; i += 1) boss.attack();
    expect(boss.status).toBe("purifiable"); expect(boss.cleanse()).toBe(true); expect(inventory.quantity("material_purified_wood")).toBe(1); expect(inventory.quantity("material_forest_light")).toBe(1);
  });
});
