export const PLAYER_PORTRAIT = {
  key: "player-main-v1",
  path: "/assets/characters/player-main-v1.png",
} as const;

export type PlayerFacing = "up" | "down" | "left" | "right";

const FIELD_FRAME = { width: 32, height: 48, originY: 0.94 } as const;

export const PLAYER_FIELD_SPRITES = {
  down: { key: "player-field-v1", path: "/assets/characters/player-field-v1.png", ...FIELD_FRAME },
  up: { key: "player-field-back-v1", path: "/assets/characters/player-field-back-v1.png", ...FIELD_FRAME },
  right: { key: "player-field-side-v1", path: "/assets/characters/player-field-side-v1.png", ...FIELD_FRAME },
  left: { key: "player-field-side-v1", path: "/assets/characters/player-field-side-v1.png", ...FIELD_FRAME },
} as const satisfies Record<PlayerFacing, { key: string; path: string; width: number; height: number; originY: number }>;

export const PLAYER_WALK_SPRITES = {
  down: { key: "player-walk-down-v1", path: "/assets/characters/player-walk-down-v1.png", ...FIELD_FRAME },
  up: { key: "player-walk-up-v1", path: "/assets/characters/player-walk-up-v1.png", ...FIELD_FRAME },
  right: { key: "player-walk-side-v1", path: "/assets/characters/player-walk-side-v1.png", ...FIELD_FRAME },
  left: { key: "player-walk-side-v1", path: "/assets/characters/player-walk-side-v1.png", ...FIELD_FRAME },
} as const satisfies Record<PlayerFacing, { key: string; path: string; width: number; height: number; originY: number }>;

export const PLAYER_FIELD_SPRITE = {
  ...PLAYER_FIELD_SPRITES.down,
  width: 32,
  height: 48,
  originY: 0.94,
} as const;

export const playerFieldSprite = (facing: PlayerFacing) => PLAYER_FIELD_SPRITES[facing];
export const playerWalkSprite = (facing: PlayerFacing) => PLAYER_WALK_SPRITES[facing];

export const playerFieldTextures = () => [...new Map(
  [...Object.values(PLAYER_FIELD_SPRITES), ...Object.values(PLAYER_WALK_SPRITES)].map((sprite) => [sprite.key, sprite]),
).values()];
