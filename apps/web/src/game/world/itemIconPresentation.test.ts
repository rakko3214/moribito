import { describe, expect, it } from "vitest";
import { hasItemIcon, itemIconFrame } from "./itemIconPresentation.js";

describe("item icon presentation", () => {
  it("maps representative inventory items to stable atlas frames", () => {
    expect(itemIconFrame("seed_daikon")).toBe(0);
    expect(itemIconFrame("fish_koi")).toBe(27);
    expect(itemIconFrame("food_herb_rice")).toBe(38);
    expect(itemIconFrame("medicine_healing")).toBe(41);
    expect(itemIconFrame("stone_rapid")).toBe(57);
  });

  it("reports unsupported placeables without inventing an atlas frame", () => {
    expect(hasItemIcon("building_chicken_coop")).toBe(false);
  });
});
