import { describe, expect, it } from "vitest";
import { gatheringNodeFrame, GATHERING_SPRITE_SHEET } from "./gatheringPresentation.js";

describe("gathering presentation", () => {
  it("maps all renewable materials to distinct frames", () => {
    expect([
      "item_yomogi", "item_mushroom", "item_mountain_greens", "item_river_algae", "item_spring_water", "item_spirit_acorn",
    ].map(gatheringNodeFrame)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("maps chapter-three clues and leaves unknown items to fallback", () => {
    expect(gatheringNodeFrame("clue_broken_branch")).toBe(6);
    expect(gatheringNodeFrame("clue_yota_footprint")).toBe(7);
    expect(gatheringNodeFrame("clue_guiding_nut")).toBe(8);
    expect(gatheringNodeFrame("unknown")).toBeUndefined();
  });

  it("describes the generated four-column sheet", () => {
    expect(GATHERING_SPRITE_SHEET).toMatchObject({ frameWidth: 362, frameHeight: 362 });
  });
});
