import { describe, expect, it } from "vitest";
import { combatHudText, farmingActionMessage, fieldToolFrame, FIELD_TOOL_SPRITE_SHEET } from "./fieldActionPresentation.js";

describe("field action presentation", () => {
  it("formats readable combat gauges and instructions", () => {
    const text = combatHudText({ status: "battle", enemyType: "ranged", wards: 2, maxWards: 3, corruption: 3, maxCorruption: 5, attacks: 2, spirit: 60, maxSpirit: 100, barrierActive: false, barrierDurability: 3 });
    expect(text).toContain("遠距離型");
    expect(text).toContain("護身札 ●●○");
    expect(text).toContain("回避か結界");
  });
  it("explains the next farming step", () => {
    expect(farmingActionMessage.plant).toContain("毎日水");
    expect(farmingActionMessage.harvest).toContain("収穫");
  });
  it("maps tools and distinguishes hand harvest from pickup", () => {
    expect(["tool_hoe", "tool_axe", "tool_pickaxe", "tool_watering_can"].map((tool) => fieldToolFrame(tool as Parameters<typeof fieldToolFrame>[0]))).toEqual([0, 1, 2, 3]);
    expect(fieldToolFrame("tool_hand")).toBe(4);
    expect(fieldToolFrame("tool_hand", "harvest")).toBe(5);
    expect(FIELD_TOOL_SPRITE_SHEET.frameWidth).toBe(512);
  });
});
