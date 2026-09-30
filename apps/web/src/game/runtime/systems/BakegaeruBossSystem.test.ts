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
  it("does not skip a prepared attack by repeated inputs", () => {
    const { boss } = setup(); boss.start();
    const attack = boss.prepareNextAttack();
    expect(boss.attack()).toBe(false);
    expect(boss.prepareNextAttack()).toBeUndefined();
    expect(boss.currentAttack).toBe(attack);
    expect(boss.corruption).toBe(12);
    expect(boss.resolvePreparedAttack(false, false)).toBe(true);
    expect(boss.resolvePreparedAttack(false, false)).toBe(false);
    expect(boss.wards).toBe(3);
    expect(boss.attack()).toBe(true);
  });
  it("resets attack and wards for a retry and grants rewards once", () => {
    const { boss, inventory } = setup(); boss.start();
    for (let i = 0; i < 4; i++) { boss.prepareNextAttack(); boss.resolvePreparedAttack(false, false); }
    expect(boss.status).toBe("defeated");
    expect(boss.attack()).toBe(false);
    boss.start();
    expect(boss.wards).toBe(4); expect(boss.currentAttack).toBeUndefined();
    for (let i = 0; i < 12; i++) boss.attack();
    expect(boss.cleanse()).toBe(true);
    expect(boss.cleanse()).toBe(false);
    expect(inventory.quantity("material_purified_water")).toBe(1);
  });
  it("changes attack language across three corruption phases", () => {
    const { boss } = setup(); boss.start();
    expect(boss.phase).toBe(1); expect(boss.prepareNextAttack()?.kind).toBe("normal");
    boss.resolvePreparedAttack(true, false);
    for (let i = 0; i < 4; i += 1) boss.attack();
    expect(boss.phase).toBe(2); expect(boss.prepareNextAttack()?.kind).toBe("piercing");
    boss.resolvePreparedAttack(true, false);
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
