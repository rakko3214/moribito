import { describe, expect, it } from "vitest";
import { advanceCookingMiniGame, cookingAdvice, createCookingMiniGame, setCookingHeat } from "./CookingMiniGame.js";

describe("CookingMiniGame", () => {
  it("clamps heat controlled by vertical swipes", () => {
    expect(setCookingHeat(createCookingMiniGame(), 2).heat).toBe(1);
    expect(setCookingHeat(createCookingMiniGame(), -1).heat).toBe(0);
  });
  it("rewards keeping heat near the target", () => {
    const state = createCookingMiniGame();
    const aligned = setCookingHeat(state, state.targetHeat);
    expect(advanceCookingMiniGame(aligned, 100).qualityScore).toBeGreaterThan(state.qualityScore);
  });
  it("builds burn when heat remains excessive", () => {
    const hot = setCookingHeat(createCookingMiniGame(), 1);
    expect(advanceCookingMiniGame(hot, 1000).burn).toBeGreaterThan(0);
  });
  it("provides Kaede advice for the current heat", () => {
    expect(cookingAdvice(setCookingHeat(createCookingMiniGame(), 1))).toContain("強すぎる");
    expect(cookingAdvice(setCookingHeat(createCookingMiniGame(), 0))).toContain("強火");
  });
});
