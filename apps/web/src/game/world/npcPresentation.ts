import type { NpcId } from "../runtime/systems/NpcInteractionSystem.js";

export type NpcSpriteDefinition = { key: string; path: string; width: number; height: number; originY: number };
export type NpcPortraitDefinition = { key: string; path: string; alt: string };
export type NpcFacing = "down" | "up" | "left" | "right";
export type NpcFieldDisplaySize = { width: number; height: number };

const NPC_FIELD_DISPLAY_SIZES: Record<NpcId, NpcFieldDisplaySize> = {
  shiki: { width: 34, height: 51 },
  kaede: { width: 38, height: 57 },
  tessai: { width: 40, height: 58 },
  genzo: { width: 38, height: 57 },
  kannushi: { width: 38, height: 57 },
  soichiro: { width: 40, height: 58 },
  sogen: { width: 38, height: 57 },
  yota: { width: 29, height: 43 },
};

const SHIKI_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-shiki-field-v1", path: "/assets/characters/npc-shiki-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-shiki-field-back-v1", path: "/assets/characters/npc-shiki-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-shiki-field-side-v1", path: "/assets/characters/npc-shiki-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-shiki-field-side-v1", path: "/assets/characters/npc-shiki-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const SHIKI_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-shiki-walk-down-v1", path: "/assets/characters/npc-shiki-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-shiki-walk-up-v1", path: "/assets/characters/npc-shiki-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-shiki-walk-side-v1", path: "/assets/characters/npc-shiki-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-shiki-walk-side-v1", path: "/assets/characters/npc-shiki-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const KAEDE_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-kaede-field-v1", path: "/assets/characters/npc-kaede-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-kaede-field-back-v1", path: "/assets/characters/npc-kaede-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-kaede-field-side-v1", path: "/assets/characters/npc-kaede-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-kaede-field-side-v1", path: "/assets/characters/npc-kaede-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const KAEDE_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-kaede-walk-down-v1", path: "/assets/characters/npc-kaede-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-kaede-walk-up-v1", path: "/assets/characters/npc-kaede-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-kaede-walk-side-v1", path: "/assets/characters/npc-kaede-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-kaede-walk-side-v1", path: "/assets/characters/npc-kaede-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const TESSAI_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-tessai-field-v1", path: "/assets/characters/npc-tessai-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-tessai-field-back-v1", path: "/assets/characters/npc-tessai-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-tessai-field-side-v1", path: "/assets/characters/npc-tessai-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-tessai-field-side-v1", path: "/assets/characters/npc-tessai-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const TESSAI_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-tessai-walk-down-v1", path: "/assets/characters/npc-tessai-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-tessai-walk-up-v1", path: "/assets/characters/npc-tessai-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-tessai-walk-side-v1", path: "/assets/characters/npc-tessai-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-tessai-walk-side-v1", path: "/assets/characters/npc-tessai-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const GENZO_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-genzo-field-v1", path: "/assets/characters/npc-genzo-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-genzo-field-back-v1", path: "/assets/characters/npc-genzo-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-genzo-field-side-v1", path: "/assets/characters/npc-genzo-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-genzo-field-side-v1", path: "/assets/characters/npc-genzo-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const GENZO_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-genzo-walk-down-v1", path: "/assets/characters/npc-genzo-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-genzo-walk-up-v1", path: "/assets/characters/npc-genzo-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-genzo-walk-side-v1", path: "/assets/characters/npc-genzo-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-genzo-walk-side-v1", path: "/assets/characters/npc-genzo-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const KANNUSHI_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-kannushi-field-v1", path: "/assets/characters/npc-kannushi-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-kannushi-field-back-v1", path: "/assets/characters/npc-kannushi-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-kannushi-field-side-v1", path: "/assets/characters/npc-kannushi-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-kannushi-field-side-v1", path: "/assets/characters/npc-kannushi-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const KANNUSHI_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-kannushi-walk-down-v1", path: "/assets/characters/npc-kannushi-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-kannushi-walk-up-v1", path: "/assets/characters/npc-kannushi-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-kannushi-walk-side-v1", path: "/assets/characters/npc-kannushi-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-kannushi-walk-side-v1", path: "/assets/characters/npc-kannushi-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const SOICHIRO_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-soichiro-field-v1", path: "/assets/characters/npc-soichiro-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-soichiro-field-back-v1", path: "/assets/characters/npc-soichiro-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-soichiro-field-side-v1", path: "/assets/characters/npc-soichiro-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-soichiro-field-side-v1", path: "/assets/characters/npc-soichiro-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const SOICHIRO_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-soichiro-walk-down-v1", path: "/assets/characters/npc-soichiro-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-soichiro-walk-up-v1", path: "/assets/characters/npc-soichiro-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-soichiro-walk-side-v1", path: "/assets/characters/npc-soichiro-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-soichiro-walk-side-v1", path: "/assets/characters/npc-soichiro-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const SOGEN_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-sogen-field-v1", path: "/assets/characters/npc-sogen-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-sogen-field-back-v1", path: "/assets/characters/npc-sogen-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-sogen-field-side-v1", path: "/assets/characters/npc-sogen-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-sogen-field-side-v1", path: "/assets/characters/npc-sogen-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const SOGEN_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-sogen-walk-down-v1", path: "/assets/characters/npc-sogen-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-sogen-walk-up-v1", path: "/assets/characters/npc-sogen-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-sogen-walk-side-v1", path: "/assets/characters/npc-sogen-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-sogen-walk-side-v1", path: "/assets/characters/npc-sogen-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const YOTA_FIELD_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-yota-field-v1", path: "/assets/characters/npc-yota-field-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-yota-field-back-v1", path: "/assets/characters/npc-yota-field-back-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-yota-field-side-v1", path: "/assets/characters/npc-yota-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-yota-field-side-v1", path: "/assets/characters/npc-yota-field-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const YOTA_WALK_SPRITES: Record<NpcFacing, NpcSpriteDefinition> = {
  down: { key: "npc-yota-walk-down-v1", path: "/assets/characters/npc-yota-walk-down-v1.png", width: 32, height: 48, originY: 0.94 },
  up: { key: "npc-yota-walk-up-v1", path: "/assets/characters/npc-yota-walk-up-v1.png", width: 32, height: 48, originY: 0.94 },
  left: { key: "npc-yota-walk-side-v1", path: "/assets/characters/npc-yota-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
  right: { key: "npc-yota-walk-side-v1", path: "/assets/characters/npc-yota-walk-side-v1.png", width: 32, height: 48, originY: 0.94 },
};

const DIRECTIONAL_SPRITES: Partial<Record<NpcId, Record<NpcFacing, NpcSpriteDefinition>>> = {
  shiki: SHIKI_FIELD_SPRITES,
  kaede: KAEDE_FIELD_SPRITES,
  tessai: TESSAI_FIELD_SPRITES,
  genzo: GENZO_FIELD_SPRITES,
  kannushi: KANNUSHI_FIELD_SPRITES,
  soichiro: SOICHIRO_FIELD_SPRITES,
  sogen: SOGEN_FIELD_SPRITES,
  yota: YOTA_FIELD_SPRITES,
};

const WALK_SPRITES: Partial<Record<NpcId, Record<NpcFacing, NpcSpriteDefinition>>> = {
  shiki: SHIKI_WALK_SPRITES,
  kaede: KAEDE_WALK_SPRITES,
  tessai: TESSAI_WALK_SPRITES,
  genzo: GENZO_WALK_SPRITES,
  kannushi: KANNUSHI_WALK_SPRITES,
  soichiro: SOICHIRO_WALK_SPRITES,
  sogen: SOGEN_WALK_SPRITES,
  yota: YOTA_WALK_SPRITES,
};

const NPC_SPRITES: Partial<Record<NpcId, NpcSpriteDefinition>> = {
  shiki: SHIKI_FIELD_SPRITES.down,
  kaede: KAEDE_FIELD_SPRITES.down,
  tessai: TESSAI_FIELD_SPRITES.down,
  genzo: GENZO_FIELD_SPRITES.down,
  kannushi: KANNUSHI_FIELD_SPRITES.down,
  soichiro: SOICHIRO_FIELD_SPRITES.down,
  sogen: SOGEN_FIELD_SPRITES.down,
  yota: YOTA_FIELD_SPRITES.down,
};

const NPC_PORTRAITS: Partial<Record<NpcId, NpcPortraitDefinition>> = {
  shiki: { key: "npc-shiki-portrait-v3", path: "/assets/characters/npc-shiki-v3.png", alt: "志希の会話用立ち絵" },
  kaede: { key: "npc-kaede-portrait-v1", path: "/assets/characters/npc-kaede-v1.png", alt: "楓の会話用立ち絵" },
  genzo: { key: "npc-genzo-portrait-v1", path: "/assets/characters/npc-genzo-v1.png", alt: "源三の会話用立ち絵" },
  tessai: { key: "npc-tessai-portrait-v1", path: "/assets/characters/npc-tessai-v1.png", alt: "鉄斎の会話用立ち絵" },
  kannushi: { key: "npc-kannushi-portrait-v1", path: "/assets/characters/npc-kannushi-v1.png", alt: "神主の会話用立ち絵" },
  soichiro: { key: "npc-soichiro-portrait-v1", path: "/assets/characters/npc-soichiro-v1.png", alt: "宗一郎の会話用立ち絵" },
  sogen: { key: "npc-sogen-portrait-v1", path: "/assets/characters/npc-sogen-v1.png", alt: "宗玄の会話用立ち絵" },
  yota: { key: "npc-yota-portrait-v1", path: "/assets/characters/npc-yota-v1.png", alt: "陽太の会話用立ち絵" },
};

export const npcSprite = (id: NpcId) => NPC_SPRITES[id];
export const npcFieldDisplaySize = (id: NpcId) => NPC_FIELD_DISPLAY_SIZES[id];
export const npcPortrait = (id: NpcId) => NPC_PORTRAITS[id];
export const npcPortraitTextures = () => Object.values(NPC_PORTRAITS).filter((portrait): portrait is NpcPortraitDefinition => Boolean(portrait));
export const npcDirectionalSprite = (id: NpcId, facing: NpcFacing) => DIRECTIONAL_SPRITES[id]?.[facing] ?? NPC_SPRITES[id];
export const npcWalkSprite = (id: NpcId, facing: NpcFacing) => WALK_SPRITES[id]?.[facing] ?? NPC_SPRITES[id];
export const npcSpriteTextures = () => {
  const sprites = [
    ...Object.values(NPC_SPRITES),
    ...Object.values(DIRECTIONAL_SPRITES).flatMap((directions) => Object.values(directions ?? {})),
    ...Object.values(WALK_SPRITES).flatMap((directions) => Object.values(directions ?? {})),
  ].filter((sprite): sprite is NpcSpriteDefinition => Boolean(sprite));

  return [...new Map(sprites.map((sprite) => [sprite.key, sprite])).values()];
};
