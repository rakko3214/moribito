import { describe, expect, it } from "vitest";
import { createInitialState } from "../initialState.js";
import { CombatSystem } from "./CombatSystem.js";
import { InventorySystem } from "./InventorySystem.js";
import { YokaiCardSystem } from "./YokaiCardSystem.js";

describe("YokaiCardSystem", () => {
  function setup() {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, () => undefined);
    const combat = new CombatSystem(() => undefined, inventory);
    const cards = new YokaiCardSystem(() => state, () => undefined, combat);
    return { state, combat, cards };
  }

  it("unlocks a card only when an explicit friendship event grants it", () => {
    const { cards } = setup();
    expect(cards.unlock("kappa")).toBe(true);
    expect(cards.cards).toEqual([{ id: "kappa", rank: 1, friendship: 0, upgrade: 0 }]);
    expect(cards.equippedId).toBe("kappa");
    expect(cards.unlock("kappa")).toBe(false);
  });

  it("only changes equipment in a safe location outside combat", () => {
    const { cards, combat } = setup();
    cards.unlock("kappa"); cards.unlock("kitsune");
    expect(cards.equip("kitsune", "map_forest")).toBe(false);
    combat.start();
    expect(cards.equip("kitsune", "map_home")).toBe(false);
    while (combat.state.status === "battle") combat.attack(10);
    combat.cleanse();
    expect(cards.equip("kitsune", "map_home")).toBe(true);
  });

  it("spends spirit, applies the active effect and observes cooldown", () => {
    const { cards, combat } = setup();
    cards.unlock("kappa"); combat.start("area");
    expect(cards.activate()).toBe(true);
    expect(combat.state.spirit).toBe(30);
    expect(combat.state.corruption).toBe(6);
    expect(cards.activate()).toBe(false);
    cards.update(8_000);
    expect(cards.isReady).toBe(true);
    expect(cards.activate()).toBe(true);
  });
});
