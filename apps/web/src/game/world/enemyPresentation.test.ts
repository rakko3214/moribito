import { describe, expect, it } from "vitest";
import { BAKEGAERU_CORRUPTED_SPRITE, enemySpriteTextures, KEGARE_REMNANT_SPRITE, YODOMI_TREE_SPRITE } from "./enemyPresentation.js";

describe("enemy presentation", () => {
  it("registers the normal Kegare remnant field sprite", () => {
    expect(KEGARE_REMNANT_SPRITE).toEqual({
      key: "enemy-kegare-remnant-v1",
      path: "/assets/enemies/kegare-remnant-v1.png",
      width: 48,
      height: 48,
      originY: 0.82,
    });
    expect(enemySpriteTextures()).toEqual([KEGARE_REMNANT_SPRITE, BAKEGAERU_CORRUPTED_SPRITE, YODOMI_TREE_SPRITE]);
    expect(BAKEGAERU_CORRUPTED_SPRITE).toMatchObject({ key: "enemy-bakegaeru-corrupted-v1", width: 96, height: 96 });
    expect(YODOMI_TREE_SPRITE).toMatchObject({ key: "enemy-yodomi-tree-v1", width: 180, height: 210 });
  });
});
