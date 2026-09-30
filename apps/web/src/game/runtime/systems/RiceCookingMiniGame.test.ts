import { describe, expect, it } from "vitest";
import { applyRiceMix, createRiceCooking, placeRicePortion, riceCookingQuality, type RiceCookingState } from "./RiceCookingMiniGame.js";

describe("RiceCookingMiniGame", () => {
  it.each([NaN, Infinity, -Infinity])("ignores invalid gesture distance %s", (distance) => {
    const state = createRiceCooking();
    expect(applyRiceMix(state, distance)).toBe(state);
    const plating = { ...state, phase: "plating" as const };
    expect(placeRicePortion(plating, distance)).toBe(plating);
  });
  it("rejects outside bowl taps and keeps completion immutable", () => {
    const state = { ...createRiceCooking(), phase: "plating" as const };
    expect(placeRicePortion(state, -1)).toBe(state);
    expect(placeRicePortion(state, 1.1)).toBe(state);
    const complete = { ...state, phase: "complete" as const, portions: 3 };
    expect(placeRicePortion(complete, 0)).toBe(complete);
    expect(applyRiceMix(complete, 60)).toBe(complete);
  });
  it("ignores short mixing gestures", () => expect(applyRiceMix(createRiceCooking(), 20).strokes).toBe(0));
  it("moves to plating after six strokes", () => {
    let state = createRiceCooking();
    for (const distance of [60, -60, 60, -60, 60, -60]) state = applyRiceMix(state, distance);
    expect(state.phase).toBe("plating");
  });
  it("rewards alternating directions", () => {
    const alternating = applyRiceMix(applyRiceMix(createRiceCooking(), 60), -60);
    const repeated = applyRiceMix(applyRiceMix(createRiceCooking(), 60), 60);
    expect(alternating.score).toBeGreaterThan(repeated.score);
  });
  it("completes after placing three portions", () => {
    let state: RiceCookingState = { ...createRiceCooking(), phase: "plating", score: 0.66 };
    state = placeRicePortion(state, 0.1); state = placeRicePortion(state, 0.1); state = placeRicePortion(state, 0.1);
    expect(state.phase).toBe("complete"); expect(riceCookingQuality(state)).toBe("great");
  });
});
