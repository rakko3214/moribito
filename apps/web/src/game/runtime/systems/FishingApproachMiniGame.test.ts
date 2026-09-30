import { describe, expect, it } from "vitest";
import { advanceFishingApproach, castTowardFish, createFishingApproach, hookFishingApproach } from "./FishingApproachMiniGame.js";

describe("FishingApproachMiniGame", () => {
  it("accepts a swipe toward the fish and rejects a wrong cast", () => {
    expect(castTowardFish(createFishingApproach(), 55, -84).phase).toBe("approaching");
    expect(castTowardFish(createFishingApproach(), -80, 20).phase).toBe("escaped");
  });
  it("uses three nibbles before the real bite", () => {
    let state = castTowardFish(createFishingApproach(), 55, -84);
    state = advanceFishingApproach(state, 760);
    for (let count = 0; count < 3; count += 1) state = advanceFishingApproach(state, 520);
    expect(state.phase).toBe("bite"); expect(state.nibbleCount).toBe(3);
  });
  it("escapes on an early hook and succeeds during the bite window", () => {
    expect(hookFishingApproach({ ...createFishingApproach(), phase: "nibbling" }).phase).toBe("escaped");
    expect(hookFishingApproach({ ...createFishingApproach(), phase: "bite" }).phase).toBe("hooked");
  });
  it("escapes when the bite window expires", () => {
    expect(advanceFishingApproach({ ...createFishingApproach(), phase: "bite" }, 680).phase).toBe("escaped");
  });
  it("gives crucian carp fewer feints and a longer hook window", () => {
    let state = castTowardFish(createFishingApproach("fish_crucian_carp"), 55, -84);
    state = advanceFishingApproach(state, 1_050);
    state = advanceFishingApproach(state, 720);
    state = advanceFishingApproach(state, 720);
    expect(state.phase).toBe("bite");
    expect(advanceFishingApproach(state, 700).phase).toBe("bite");
  });
});
