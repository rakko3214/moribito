import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ALCHEMY_RECIPES, AlchemySystem } from "./AlchemySystem.js";
import { InventorySystem } from "./InventorySystem.js";
import { OfferingSystem } from "./OfferingSystem.js";
import { ShopSystem } from "./ShopSystem.js";

describe("phase 3 life economy systems", () => {
  it.each([0, -1, 0.5, NaN, Infinity])("rejects invalid trade quantities without changing money or inventory: %s", (quantity) => {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, vi.fn());
    const shop = new ShopSystem(() => state, vi.fn(), inventory);
    const before = structuredClone(state);
    expect(shop.buy("seed_daikon", 20, quantity)).toBe(false);
    expect(shop.sell("seed_daikon", 20, quantity)).toBe(false);
    expect(state).toEqual(before);
  });
  it.each([0, -1, 0.5, NaN, Infinity])("rejects invalid trade prices without mutations: %s", (price) => {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, vi.fn());
    inventory.add("seed_daikon", 2);
    const shop = new ShopSystem(() => state, vi.fn(), inventory);
    const before = structuredClone(state);
    expect(shop.buy("seed_daikon", price)).toBe(false);
    expect(shop.sell("seed_daikon", price)).toBe(false);
    expect(state).toEqual(before);
  });
  it("crafts medicine from a gathered herb", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_yomogi", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn());
    expect(new AlchemySystem(() => state, vi.fn(), inventory).craft()).toBe(true);
    expect(inventory.quantity("medicine_healing")).toBe(1);
    state.inventory.items.push({ itemId: "item_yomogi", quantity: 1 });
    expect(new AlchemySystem(() => state, vi.fn(), inventory).craft(2)).toBe(true);
    expect(inventory.quantity("medicine_healing")).toBe(3);
    state.inventory.items.push({ itemId: "item_yomogi", quantity: 1 });
    expect(new AlchemySystem(() => state, vi.fn(), inventory).craft(1, "item_crude_product")).toBe(true);
    inventory.add("item_yomogi", 1); inventory.add("item_spring_water", 1);
    expect(new AlchemySystem(() => state, vi.fn(), inventory).craft(1, undefined, "purification")).toBe(true);
    expect(inventory.quantity("medicine_purifying")).toBe(1);
    expect(inventory.quantity("item_spring_water")).toBe(0);
    expect(inventory.quantity("item_crude_product")).toBe(1);
  });
  it("defines five remedies and consumes every ingredient of a compound remedy", () => {
    expect(Object.keys(ALCHEMY_RECIPES)).toHaveLength(5);
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_mushroom", quantity: 1 }, { itemId: "item_cucumber", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const alchemy = new AlchemySystem(() => state, vi.fn(), inventory);
    expect(alchemy.craft(1, undefined, "antidote")).toBe(true); expect(inventory.quantity("medicine_antidote")).toBe(1); expect(inventory.quantity("item_mushroom")).toBe(0); expect(inventory.quantity("item_cucumber")).toBe(0);
  });
  it("buys and sells items using player money", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn());
    const shop = new ShopSystem(() => state, vi.fn(), inventory);
    expect(shop.buy("seed_daikon", 20, 2)).toBe(true); expect(state.player.money).toBe(460);
    expect(shop.sell("seed_daikon", 10)).toBe(true); expect(state.player.money).toBe(470);
  });
  it("rejects a purchase without enough money", () => {
    const state = createInitialState(); state.player.money = 5; const inventory = new InventorySystem(() => state, vi.fn());
    expect(new ShopSystem(() => state, vi.fn(), inventory).buy("seed_daikon", 20)).toBe(false);
  });
  it("consumes each required offering once and completes the set", () => {
    const state = createInitialState();
    state.inventory.items.push({ itemId: "food_simmered_daikon", quantity: 1 }, { itemId: "fish_ayu", quantity: 1 }, { itemId: "medicine_healing", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn()); const offering = new OfferingSystem(() => state, vi.fn(), inventory);
    expect(offering.offerNextAvailable()).toBe("food_simmered_daikon");
    expect(offering.offerNextAvailable()).toBe("fish_ayu");
    expect(offering.offerNextAvailable()).toBe("medicine_healing");
    expect(offering.isComplete()).toBe(true); expect(offering.completedCount).toBe(3);
  });
});
