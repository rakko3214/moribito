import { describe, expect, it } from "vitest";
import { applyCookingCut, createCookingPrep, prepQuality } from "./CookingPrepMiniGame.js";

describe("CookingPrepMiniGame", () => {
  it("requires a deliberate vertical swipe", () => {
    expect(applyCookingCut(createCookingPrep(), 0.25, 20).cuts).toHaveLength(0);
  });

  it("records each cut target only once", () => {
    const first = applyCookingCut(createCookingPrep(), 0.25, 80);
    expect(applyCookingCut(first, 0.25, 80).cuts).toEqual([0]);
  });

  it("completes after all three cut positions", () => {
    let state = createCookingPrep();
    state = applyCookingCut(state, 0.25, 80);
    state = applyCookingCut(state, 0.5, -80);
    state = applyCookingCut(state, 0.75, 80);
    expect(state.complete).toBe(true);
    expect(prepQuality(state)).toBe("great");
  });

  it("accepts slightly imprecise cuts with a lower evaluation", () => {
    let state = createCookingPrep();
    state = applyCookingCut(state, 0.14, 80);
    state = applyCookingCut(state, 0.39, 80);
    state = applyCookingCut(state, 0.64, 80);
    expect(prepQuality(state)).toBe("incomplete");
  });
});
