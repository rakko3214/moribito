import { describe, expect, it } from "vitest";
import { createFishingMiniGame, updateFishingMiniGame } from "./FishingMiniGame.js";

describe("FishingMiniGame", () => {
  it("keeps fish and catcher on one clock during a delayed frame", () => {
    const state = createFishingMiniGame("fish_ayu");
    const delayed = updateFishingMiniGame(state, true, 200);
    let regular = state;
    for (let i = 0; i < 24; i++) regular = updateFishingMiniGame(regular, true, 1000 / 120);
    expect(delayed.elapsedMs).toBeCloseTo(regular.elapsedMs);
    expect(delayed.catcherPosition).toBeCloseTo(regular.catcherPosition, 8);
    expect(delayed.catchProgress).toBeCloseTo(regular.catchProgress, 8);
  });
  it.each([NaN, Infinity, -10, 0])("ignores invalid frame duration %s", (delta) => {
    const state = createFishingMiniGame("fish_ayu");
    expect(updateFishingMiniGame(state, true, delta)).toBe(state);
  });
  it("raises the catcher while held and lowers it after release", () => {
    let state = createFishingMiniGame("fish_crucian_carp");
    const initial = state.catcherPosition;
    state = updateFishingMiniGame(state, true, 300);
    expect(state.catcherPosition).toBeGreaterThan(initial);
    const raised = state.catcherPosition;
    for (let i = 0; i < 10; i += 1) state = updateFishingMiniGame(state, false, 50);
    expect(state.catcherPosition).toBeLessThan(raised);
  });
  it("reacts quickly enough for phone press and release controls", () => {
    let state = createFishingMiniGame("fish_crucian_carp");
    for (let i = 0; i < 5; i += 1) state = updateFishingMiniGame(state, true, 50);
    expect(state.catcherPosition).toBeGreaterThan(0.62);
    for (let i = 0; i < 10; i += 1) state = updateFishingMiniGame(state, false, 50);
    expect(state.catcherPosition).toBeLessThan(0.55);
  });
  it("starts with the fish centered inside the catcher", () => {
    const state = createFishingMiniGame("fish_ayu");
    expect(state.catcherPosition).toBe(state.fishPosition);
  });
  it("increases progress while the fish is inside the catcher", () => {
    const state = createFishingMiniGame("fish_crucian_carp");
    const aligned = { ...state, catcherPosition: state.fishPosition };
    expect(updateFishingMiniGame(aligned, false, 50).catchProgress).toBeGreaterThan(aligned.catchProgress);
  });
  it("escapes when the progress reaches zero", () => {
    let state = { ...createFishingMiniGame("fish_ayu"), catcherPosition: 0, catchProgress: 0.001 };
    state = updateFishingMiniGame(state, false, 50);
    expect(state.status).toBe("escaped");
  });
});
