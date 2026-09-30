import { describe, expect, it } from "vitest";
import { cropSpriteFrame, cropSpritePresentation, FARM_EXPANDED_SPRITE_SHEET, FARM_SPRITE_SHEET } from "./cropPresentation.js";

describe("crop presentation", () => {
  it("maps four-stage crops from sprouts to their harvest frame", () => {
    expect(cropSpriteFrame("crop_daikon", 1, 4)).toBe(0);
    expect(cropSpriteFrame("crop_daikon", 4, 4)).toBe(3);
    expect(cropSpriteFrame("crop_cucumber", 1, 4)).toBe(4);
    expect(cropSpriteFrame("crop_cucumber", 4, 4)).toBe(7);
  });

  it("compresses longer growth schedules into the four visual stages", () => {
    expect(cropSpriteFrame("crop_pumpkin", 1, 7)).toBe(8);
    expect(cropSpriteFrame("crop_pumpkin", 7, 7)).toBe(11);
  });

  it("selects dedicated rows for every remaining crop", () => {
    expect(cropSpritePresentation("crop_carrot", 3, 3)).toEqual({ textureKey: FARM_EXPANDED_SPRITE_SHEET.key, frame: 3 });
    expect(cropSpritePresentation("crop_eggplant", 5, 5).frame).toBe(7);
    expect(cropSpritePresentation("crop_rice", 6, 6).frame).toBe(15);
  });

  it("defines consistently sized sprite sheets", () => {
    expect(FARM_SPRITE_SHEET.frameWidth).toBe(256);
    expect(FARM_SPRITE_SHEET.frameHeight).toBe(256);
    expect(FARM_EXPANDED_SPRITE_SHEET.frameWidth).toBe(256);
  });
});
