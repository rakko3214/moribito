import { describe, expect, it } from "vitest";
import { advanceForgeMiniGame, createForgeMiniGame, FORGE_TARGETS, strikeForge } from "./ForgeMiniGame.js";

describe("ForgeMiniGame", () => {
  it.each([NaN, Infinity, -1, 1.1])("ignores an invalid strike %s without consuming a target", (position) => {
    const state = createForgeMiniGame();
    expect(strikeForge(state, position)).toBe(state);
  });
  it.each([NaN, Infinity, -1, 0])("ignores invalid elapsed time %s", (delta) => {
    const state = createForgeMiniGame();
    expect(advanceForgeMiniGame(state, delta)).toBe(state);
  });
  it("rewards accurate strikes while the material is at working heat", () => {
    let state = advanceForgeMiniGame(createForgeMiniGame(), 3000);
    state = strikeForge(state, FORGE_TARGETS[0]);
    expect(state.hits).toBe(1); expect(state.score).toBe(1);
  });
  it("reduces the score for inaccurate or overheated strikes", () => {
    const inaccurate = strikeForge(createForgeMiniGame(), 1);
    const hot = strikeForge(createForgeMiniGame(), FORGE_TARGETS[0]);
    expect(inaccurate.score).toBe(0); expect(hot.score).toBe(0.55);
  });
  it("grades five accurate strikes as great", () => {
    let state = advanceForgeMiniGame(createForgeMiniGame(), 3000);
    for (const target of FORGE_TARGETS) state = strikeForge(state, target);
    state = advanceForgeMiniGame(state, 16);
    expect(state.result).toBe("great");
  });
  it("fails when the metal cools before enough strikes", () => {
    expect(advanceForgeMiniGame(createForgeMiniGame(), 11_000).result).toBe("failed");
  });
  it("makes advanced stones use more targets in less time", () => {
    const normal = createForgeMiniGame(); const hard = createForgeMiniGame("hard");
    expect(hard.targets.length).toBeGreaterThan(normal.targets.length);
    expect(hard.durationMs).toBeLessThan(normal.durationMs);
    expect(hard.tolerance).toBeLessThan(normal.tolerance);
  });
});
