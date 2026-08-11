import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { BakegaeruBossSystem } from "./BakegaeruBossSystem.js";
import { InventorySystem } from "./InventorySystem.js";

function setup() {
  const state = createInitialState();
  const inventory = new InventorySystem(() => state, vi.fn());
  return { state, inventory, boss: new BakegaeruBossSystem(vi.fn(), inventory) };
}

describe("BakegaeruBossSystem", () => {
  it("changes attack language across three corruption phases", () => {
    const { boss } = setup(); boss.start();
    expect(boss.phase).toBe(1); expect(boss.prepareNextAttack()?.kind).toBe("normal");
    for (let i = 0; i < 4; i += 1) boss.attack();
    expect(boss.phase).toBe(2); expect(boss.prepareNextAttack()?.kind).toBe("piercing");
    for (let i = 0; i < 4; i += 1) boss.attack();
    expect(boss.phase).toBe(3); expect(boss.prepareNextAttack()?.kind).toBe("ultimate");
  });

  it("requires movement for piercing attacks and a barrier for the ultimate", () => {
    const { boss } = setup(); boss.start();
    for (let i = 0; i < 4; i += 1) boss.attack();
    boss.prepareNextAttack(); boss.resolvePreparedAttack(false, true);
    expect(boss.wards).toBe(3);
    boss.prepareNextAttack(); boss.resolvePreparedAttack(true, false);
    expect(boss.wards).toBe(3);
    for (let i = 0; i < 4; i += 1) boss.attack();
    boss.prepareNextAttack(); boss.resolvePreparedAttack(true, false);
    expect(boss.wards).toBe(2); expect(boss.fatigued).toBe(true);
  });

  it("creates a large opening after the tidal wave and grants clean rewards", () => {
    const { boss, inventory } = setup(); boss.start();
    for (let i = 0; i < 8; i += 1) boss.attack();
    boss.prepareNextAttack(); boss.resolvePreparedAttack(false, true);
    expect(boss.fatigued).toBe(true);
    boss.attack(); expect(boss.corruption).toBe(2);
    boss.attack(); boss.attack();
    expect(boss.status).toBe("purifiable"); expect(boss.cleanse()).toBe(true);
    expect(inventory.quantity("material_purified_water")).toBe(1);
    expect(inventory.quantity("material_yuishi_fragment")).toBe(1);
  });
});
