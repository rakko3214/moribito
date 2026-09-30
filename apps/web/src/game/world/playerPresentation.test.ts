import { describe, expect, it } from "vitest";
import { PLAYER_FIELD_SPRITE, PLAYER_PORTRAIT, playerFieldSprite, playerFieldTextures, playerWalkSprite } from "./playerPresentation.js";

describe("player presentation", () => {
  it("keeps the conversation portrait separate from the map sprite", () => {
    expect(PLAYER_PORTRAIT.path).toBe("/assets/characters/player-main-v1.png");
    expect(PLAYER_FIELD_SPRITE.path).toBe("/assets/characters/player-field-v1.png");
  });

  it("uses the native map-sprite dimensions", () => {
    expect(PLAYER_FIELD_SPRITE).toMatchObject({ width: 32, height: 48 });
  });

  it("maps vertical and horizontal directions to dedicated field artwork", () => {
    expect(playerFieldSprite("down").key).toBe("player-field-v1");
    expect(playerFieldSprite("up").key).toBe("player-field-back-v1");
    expect(playerFieldSprite("left").key).toBe("player-field-side-v1");
    expect(playerFieldSprite("right").key).toBe("player-field-side-v1");
    expect(playerFieldTextures()).toHaveLength(6);
  });

  it("provides one stride frame for every direction", () => {
    expect(playerWalkSprite("down").key).toBe("player-walk-down-v1");
    expect(playerWalkSprite("up").key).toBe("player-walk-up-v1");
    expect(playerWalkSprite("left").key).toBe("player-walk-side-v1");
    expect(playerWalkSprite("right").key).toBe("player-walk-side-v1");
  });
});
