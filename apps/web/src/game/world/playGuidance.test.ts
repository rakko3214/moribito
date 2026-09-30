import { describe, expect, it } from "vitest";
import { actionGuidance, completionSummary } from "./playGuidance.js";

describe("play guidance", () => {
  it("turns objectives into concrete player actions", () => {
    expect(actionGuidance(1, "try_farming")).toContain("鍬");
    expect(actionGuidance(2, "fulfill_offering")).toContain("奉納台");
    expect(actionGuidance(3, "follow_clues")).toContain("3つ");
  });

  it("provides an explicit continuation after completion", () => {
    expect(actionGuidance(3, "complete")).toContain("続けられる");
  });

  it("summarizes the completed play session", () => {
    const result = completionSummary({ day: 8, completed: 12, bosses: 2, friendship: 24, money: 350 });
    expect(result).toContain("春 8日");
    expect(result).toContain("12件");
    expect(result).toContain("2体");
    expect(result).toContain("24");
    expect(result).toContain("350文");
  });
});
