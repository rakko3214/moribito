import { describe, expect, it } from "vitest";
import { livestockBuildingId, livestockSpriteFrame } from "./livestockPresentation.js";

describe("livestock presentation", () => {
  it("shows juvenile, adult, fed and product-ready chicken states", () => {
    expect(livestockSpriteFrame({ species: "chicken", ageDays: 0, fedToday: false, productReady: false })).toBe(0);
    expect(livestockSpriteFrame({ species: "chicken", ageDays: 3, fedToday: false, productReady: false })).toBe(1);
    expect(livestockSpriteFrame({ species: "chicken", ageDays: 3, fedToday: true, productReady: false })).toBe(2);
    expect(livestockSpriteFrame({ species: "chicken", ageDays: 3, fedToday: true, productReady: true })).toBe(3);
  });
  it("uses the cow row and correct home building", () => {
    expect(livestockSpriteFrame({ species: "cow", ageDays: 0, fedToday: false, productReady: false })).toBe(4);
    expect(livestockSpriteFrame({ species: "cow", ageDays: 5, fedToday: false, productReady: true })).toBe(7);
    expect(livestockBuildingId("cow")).toBe("building_livestock_barn");
  });
});
