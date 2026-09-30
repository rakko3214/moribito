import { describe, expect, it } from "vitest";
import { BOSS_ATTACK_RADIUS, TREE_SAFE_RADIUS, frogDefense, insideBossCircle } from "./bossTelegraph.js";

describe("boss telegraph contract", () => {
  it("uses the visible danger edge for the hit boundary", () => {
    expect(insideBossCircle({ x: 115, y: 0 }, { x: 0, y: 0 }, BOSS_ATTACK_RADIUS)).toBe(true);
    expect(insideBossCircle({ x: 115.01, y: 0 }, { x: 0, y: 0 }, BOSS_ATTACK_RADIUS)).toBe(false);
  });
  it("does not treat the area outside the safe ring as safe", () => {
    expect(insideBossCircle({ x: 64, y: 0 }, { x: 0, y: 0 }, TREE_SAFE_RADIUS)).toBe(true);
    expect(insideBossCircle({ x: 68, y: 0 }, { x: 0, y: 0 }, TREE_SAFE_RADIUS)).toBe(false);
  });
  it.each([
    ["piercing", false, true, "hit"], ["piercing", true, true, "evaded"],
    ["ultimate", true, false, "hit"], ["ultimate", false, true, "barrier"],
    ["normal", false, true, "barrier"], ["normal", true, false, "evaded"],
    ["normal", false, false, "hit"],
  ] as const)("reports %s defense accurately", (kind, avoided, barrier, expected) => {
    expect(frogDefense(kind, avoided, barrier)).toBe(expected);
  });
});
