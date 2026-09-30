import { describe, expect, it } from "vitest";
import { advanceAlchemyMiniGame, applyAlchemyRotation, createAlchemyMiniGame, releaseAlchemyRotation, type AlchemyMiniGameState } from "./AlchemyMiniGame.js";

describe("AlchemyMiniGame", () => {
  it("scores the same gesture consistently at 30/60/90/120 Hz", () => {
    const scores = [30, 60, 90, 120].map((rate) => {
      let state = applyAlchemyRotation(createAlchemyMiniGame(), 0, 1);
      for (let i = 1; i <= rate / 10; i++) state = applyAlchemyRotation(state, i / rate, 1000 / rate);
      return state.score;
    });
    for (const score of scores) expect(score).toBeCloseTo(scores[0]!, 8);
  });
  it("ignores invalid input and time", () => {
    const state = createAlchemyMiniGame();
    expect(applyAlchemyRotation(state, NaN, 16)).toBe(state);
    expect(applyAlchemyRotation(state, 1, 0)).toBe(state);
    expect(advanceAlchemyMiniGame(state, Infinity)).toBe(state);
    expect(advanceAlchemyMiniGame(state, -10)).toBe(state);
  });
  it("rewards a slow clockwise rotation during the slow phase", () => {
    let state = applyAlchemyRotation(createAlchemyMiniGame(), 0, 100);
    state = applyAlchemyRotation(state, 0.1, 100);
    expect(state.score).toBeGreaterThan(0.45);
  });
  it("requires counterclockwise movement during the reverse phase", () => {
    let state: AlchemyMiniGameState = { ...createAlchemyMiniGame(), instruction: "reverse" };
    state = applyAlchemyRotation(state, 1, 100);
    state = applyAlchemyRotation(state, 0.7, 100);
    expect(state.score).toBeGreaterThan(0.45);
  });
  it("clears the previous angle when the finger is released", () => {
    const state = releaseAlchemyRotation({ ...createAlchemyMiniGame(), lastAngle: 1 });
    expect(state.lastAngle).toBeUndefined();
  });
  it("changes instructions and grades the result after ten seconds", () => {
    let state = advanceAlchemyMiniGame(createAlchemyMiniGame(), 7600);
    expect(state.instruction).toBe("reverse");
    state = advanceAlchemyMiniGame({ ...state, score: 0.9 }, 2500);
    expect(state.quality).toBe("great");
  });
  it("uses a longer sequence for advanced medicine", () => {
    const normal = createAlchemyMiniGame("normal");
    const hard = createAlchemyMiniGame("hard");
    expect(hard.durationMs).toBeGreaterThan(normal.durationMs);
    expect(advanceAlchemyMiniGame(hard, 10_000).quality).toBeUndefined();
    expect(createAlchemyMiniGame("expert").durationMs).toBe(14_000);
  });
});
