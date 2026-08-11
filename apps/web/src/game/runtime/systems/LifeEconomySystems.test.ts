import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { AlchemySystem } from "./AlchemySystem.js";
import { InventorySystem } from "./InventorySystem.js";
import { OfferingSystem } from "./OfferingSystem.js";
import { ShopSystem } from "./ShopSystem.js";

describe("phase 3 life economy systems", () => {
  it("crafts medicine from a gathered herb", () => {
    const state = createInitialState(); state.inventory.items.push({ itemId: "item_yomogi", quantity: 1 });
    const inventory = new InventorySystem(() => state, vi.fn());
    expect(new AlchemySystem(() => state, vi.fn(), inventory).craft()).toBe(true);
    expect(inventory.quantity("medicine_healing")).toBe(1);
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
