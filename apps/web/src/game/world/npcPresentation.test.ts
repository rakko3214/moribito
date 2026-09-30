import { describe, expect, it } from "vitest";
import { npcDirectionalSprite, npcFieldDisplaySize, npcPortrait, npcSprite, npcSpriteTextures, npcWalkSprite } from "./npcPresentation.js";

describe("NPC presentation", () => {
  it("registers Shiki's dedicated front-facing map sprite", () => {
    expect(npcSprite("shiki")).toMatchObject({ key: "npc-shiki-field-v1", width: 32, height: 48 });
  });

  it("registers Shiki's directional map sprites without duplicating the side texture", () => {
    expect(npcDirectionalSprite("shiki", "up")?.key).toBe("npc-shiki-field-back-v1");
    expect(npcDirectionalSprite("shiki", "left")?.key).toBe("npc-shiki-field-side-v1");
    expect(npcDirectionalSprite("shiki", "right")?.key).toBe("npc-shiki-field-side-v1");
  });

  it("registers one alternate walking frame for each Shiki direction", () => {
    expect(npcWalkSprite("shiki", "down")?.key).toBe("npc-shiki-walk-down-v1");
    expect(npcWalkSprite("shiki", "up")?.key).toBe("npc-shiki-walk-up-v1");
    expect(npcWalkSprite("shiki", "left")?.key).toBe("npc-shiki-walk-side-v1");
    expect(npcWalkSprite("shiki", "right")?.key).toBe("npc-shiki-walk-side-v1");
  });

  it("registers Kaede's dedicated directional map and walking sprites", () => {
    expect(npcSprite("kaede")).toMatchObject({ key: "npc-kaede-field-v1", width: 32, height: 48 });
    expect(npcDirectionalSprite("kaede", "up")?.key).toBe("npc-kaede-field-back-v1");
    expect(npcDirectionalSprite("kaede", "left")?.key).toBe("npc-kaede-field-side-v1");
    expect(npcWalkSprite("kaede", "down")?.key).toBe("npc-kaede-walk-down-v1");
    expect(npcWalkSprite("kaede", "up")?.key).toBe("npc-kaede-walk-up-v1");
    expect(npcWalkSprite("kaede", "right")?.key).toBe("npc-kaede-walk-side-v1");
  });

  it("registers Tessai's broad directional map and walking sprites", () => {
    expect(npcSprite("tessai")).toMatchObject({ key: "npc-tessai-field-v1", width: 32, height: 48 });
    expect(npcDirectionalSprite("tessai", "up")?.key).toBe("npc-tessai-field-back-v1");
    expect(npcDirectionalSprite("tessai", "right")?.key).toBe("npc-tessai-field-side-v1");
    expect(npcWalkSprite("tessai", "down")?.key).toBe("npc-tessai-walk-down-v1");
    expect(npcWalkSprite("tessai", "up")?.key).toBe("npc-tessai-walk-up-v1");
    expect(npcWalkSprite("tessai", "left")?.key).toBe("npc-tessai-walk-side-v1");
  });

  it("registers Genzo's directional map and walking sprites", () => {
    expect(npcSprite("genzo")).toMatchObject({ key: "npc-genzo-field-v1", width: 32, height: 48 });
    expect(npcDirectionalSprite("genzo", "up")?.key).toBe("npc-genzo-field-back-v1");
    expect(npcDirectionalSprite("genzo", "right")?.key).toBe("npc-genzo-field-side-v1");
    expect(npcWalkSprite("genzo", "down")?.key).toBe("npc-genzo-walk-down-v1");
    expect(npcWalkSprite("genzo", "up")?.key).toBe("npc-genzo-walk-up-v1");
    expect(npcWalkSprite("genzo", "left")?.key).toBe("npc-genzo-walk-side-v1");
  });

  it("registers all produced NPC textures without duplicate side entries", () => {
    expect(npcSprite("sogen")?.key).toBe("npc-sogen-field-v1");
    expect(npcSpriteTextures()).toHaveLength(48);
  });

  it("registers Yota at a child-scale sprite size with movement frames", () => {
    expect(npcPortrait("yota")?.path).toBe("/assets/characters/npc-yota-v1.png");
    expect(npcDirectionalSprite("yota", "down")).toMatchObject({ key: "npc-yota-field-v1", width: 32, height: 48 });
    expect(npcWalkSprite("yota", "up")?.key).toBe("npc-yota-walk-up-v1");
    expect(npcFieldDisplaySize("yota").height).toBeLessThan(npcFieldDisplaySize("kaede").height);
  });

  it("renders adult villagers larger than the player-sized young villager while preserving their foot anchor", () => {
    expect(npcFieldDisplaySize("shiki")).toEqual({ width: 34, height: 51 });
    expect(npcFieldDisplaySize("kaede")).toEqual({ width: 38, height: 57 });
    expect(npcFieldDisplaySize("tessai")).toEqual({ width: 40, height: 58 });
    expect(npcSprite("kaede")?.originY).toBe(npcSprite("shiki")?.originY);
  });

  it("registers Sogen's portrait and field movement set", () => {
    expect(npcPortrait("sogen")?.path).toBe("/assets/characters/npc-sogen-v1.png");
    expect(npcDirectionalSprite("sogen", "up")?.key).toBe("npc-sogen-field-back-v1");
    expect(npcWalkSprite("sogen", "left")?.key).toBe("npc-sogen-walk-side-v1");
  });

  it("registers Genzo's conversation portrait alongside his map sprite", () => {
    expect(npcPortrait("genzo")).toEqual({ key: "npc-genzo-portrait-v1", path: "/assets/characters/npc-genzo-v1.png", alt: "源三の会話用立ち絵" });
    expect(npcSprite("genzo")?.key).toBe("npc-genzo-field-v1");
  });

  it("registers Kannushi and Soichiro portraits, directions, and walking frames", () => {
    expect(npcPortrait("kannushi")?.path).toBe("/assets/characters/npc-kannushi-v1.png");
    expect(npcDirectionalSprite("kannushi", "up")?.key).toBe("npc-kannushi-field-back-v1");
    expect(npcWalkSprite("kannushi", "right")?.key).toBe("npc-kannushi-walk-side-v1");
    expect(npcPortrait("soichiro")?.path).toBe("/assets/characters/npc-soichiro-v1.png");
    expect(npcDirectionalSprite("soichiro", "left")?.key).toBe("npc-soichiro-field-side-v1");
    expect(npcWalkSprite("soichiro", "down")?.key).toBe("npc-soichiro-walk-down-v1");
  });
});
