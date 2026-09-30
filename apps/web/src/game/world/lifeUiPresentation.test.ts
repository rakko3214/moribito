import { describe, expect, it } from "vitest";
import { inventoryCategoryLines } from "./lifeUiPresentation.js";

describe("inventory category presentation", () => {
  const items = [{ itemId: "item_wood", quantity: 2 }, { itemId: "food_herb_rice", quantity: 1 }, { itemId: "building_chicken_coop", quantity: 1 }];
  it("separates materials, food and placeables", () => {
    expect(inventoryCategoryLines(items, "materials")).toEqual(["木材 ×2"]);
    expect(inventoryCategoryLines(items, "food")).toEqual(["よもぎ飯 ×1"]);
    expect(inventoryCategoryLines(items, "placeables")).toEqual(["鶏小屋 ×1"]);
  });
});
