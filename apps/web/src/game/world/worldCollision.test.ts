import { describe, expect, it } from "vitest";
import { gatheringCollisionFootprint, npcCollisionFootprint } from "./worldCollision.js";

describe("world collision footprints", () => {
  it("anchors NPC collision at their feet", () => {
    expect(npcCollisionFootprint(100, 200)).toEqual({ x: 87, y: 182, width: 26, height: 18 });
  });

  it("blocks trunks and rocks but not hand-gathered materials", () => {
    expect(gatheringCollisionFootprint(100, 200, "tool_axe")).toEqual({ x: 81, y: 175, width: 38, height: 25 });
    expect(gatheringCollisionFootprint(100, 200, "tool_pickaxe")).toEqual({ x: 84, y: 178, width: 32, height: 22 });
    expect(gatheringCollisionFootprint(100, 200, "tool_hand")).toBeUndefined();
  });
});
