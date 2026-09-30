import { describe, expect, it } from "vitest";
import { bossHudText } from "./bossHud.js";
describe("boss HUD", () => {
  const state = { status: "battle", corruption: 11, maxCorruption: 12, wards: 3 };
  it("shows current corruption and remaining wards", () => {
    expect(bossHudText("化け蛙", state)).toContain("11/12");
    expect(bossHudText("化け蛙", state)).toContain("◆◆◆◇");
  });
  it("explains purification instead of suggesting more attacks", () => {
    expect(bossHudText("化け蛙", { ...state, status: "purifiable" })).toContain("近づいて浄化");
  });
  it("explains how to retry a defeat", () => {
    expect(bossHudText("化け蛙", { ...state, status: "defeated", wards: 0 })).toContain("近づいて再挑戦");
  });
});
