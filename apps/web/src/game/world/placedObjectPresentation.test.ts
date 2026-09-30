import { describe, expect, it } from "vitest";
import { CRAFTABLE_SPRITE_SHEET, FARM_BUILDING_SPRITE_SHEET, HOME_ESSENTIAL_SPRITE_SHEET, placedObjectBlocksMovement, placedObjectDisplaySize, placedObjectSprite } from "./placedObjectPresentation.js";

describe("placed object presentation", () => {
  it("maps all eight workbench results", () => {
    expect(["furniture_wooden_chair", "furniture_wooden_table", "furniture_storage_box", "placeable_livestock_fence", "placeable_fence_gate", "placeable_feed_trough", "placeable_water_trough", "placeable_wooden_sign"].map((id) => placedObjectSprite(id)?.frame)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
  it("maps the three construction buildings", () => {
    expect(["building_chicken_coop", "building_livestock_barn", "building_greenhouse"].map((id) => placedObjectSprite(id)?.textureKey)).toEqual(Array(3).fill(FARM_BUILDING_SPRITE_SHEET.key));
  });
  it("maps movable home essentials", () => {
    expect(["furniture_bed", "furniture_workbench"].map((id) => placedObjectSprite(id)?.textureKey)).toEqual(Array(2).fill(HOME_ESSENTIAL_SPRITE_SHEET.key));
  });
  it("defines sheets using their verified generated dimensions", () => {
    expect(CRAFTABLE_SPRITE_SHEET).toMatchObject({ frameWidth: 384, frameHeight: 512 });
    expect(FARM_BUILDING_SPRITE_SHEET).toMatchObject({ frameWidth: 724, frameHeight: 724 });
    expect(HOME_ESSENTIAL_SPRITE_SHEET).toMatchObject({ frameWidth: 887, frameHeight: 887 });
  });
  it("lets tall art rise above its collision footprint", () => {
    expect(placedObjectDisplaySize("furniture_wooden_chair", 38, 38)).toEqual({ width: 38, height: 47.5 });
    expect(placedObjectDisplaySize("building_chicken_coop", 152, 114)).toEqual({ width: 152, height: 159.6 });
  });
  it("keeps furniture solid and opens the fence gate for passage", () => {
    expect(placedObjectBlocksMovement("furniture_bed")).toBe(true);
    expect(placedObjectBlocksMovement("placeable_fence_gate", false)).toBe(true);
    expect(placedObjectBlocksMovement("placeable_fence_gate", true)).toBe(false);
  });
});
