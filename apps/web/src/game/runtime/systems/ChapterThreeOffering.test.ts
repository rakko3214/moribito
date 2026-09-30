import { describe, expect, it } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { OfferingSystem } from "./OfferingSystem.js";

describe("chapter three offerings", () => {
  it("requires ten dishes, four varieties, a fish dish and two gathered-ingredient dishes", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, () => undefined);
    const offering = new OfferingSystem(() => state, () => undefined, inventory);
    for (const [id, quantity] of [["food_simmered_daikon", 5], ["food_carrot_kinpira", 2], ["food_grilled_ayu", 1], ["food_herb_rice", 2]] as const) {
      inventory.add(id, quantity);
      for (let count = 0; count < quantity; count += 1) expect(offering.offerChapterThree(id)).toBe(true);
    }
    expect(offering.chapterThreeProgress).toEqual({ total: 10, varieties: 4, fish: 1, gathered: 2 });
    expect(offering.isChapterThreeComplete).toBe(true);
  });

  it("rejects failed dishes and non-food items", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, () => undefined);
    const offering = new OfferingSystem(() => state, () => undefined, inventory);
    inventory.add("food_failed_dish", 1); inventory.add("item_wood", 1);
    expect(offering.offerChapterThree("food_failed_dish")).toBe(false);
    expect(offering.offerChapterThree("item_wood")).toBe(false);
  });
});
