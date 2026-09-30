export type EnemySpriteDefinition = {
  key: string;
  path: string;
  width: number;
  height: number;
  originY: number;
};

export const KEGARE_REMNANT_SPRITE: EnemySpriteDefinition = {
  key: "enemy-kegare-remnant-v1",
  path: "/assets/enemies/kegare-remnant-v1.png",
  width: 48,
  height: 48,
  originY: 0.82,
};

export const BAKEGAERU_CORRUPTED_SPRITE: EnemySpriteDefinition = {
  key: "enemy-bakegaeru-corrupted-v1",
  path: "/assets/enemies/bakegaeru-corrupted-v1.png",
  width: 96,
  height: 96,
  originY: 0.82,
};

export const YODOMI_TREE_SPRITE: EnemySpriteDefinition = {
  key: "enemy-yodomi-tree-v1",
  path: "/assets/enemies/yodomi-tree-v1.png",
  width: 180,
  height: 210,
  originY: 0.86,
};

export const enemySpriteTextures = () => [KEGARE_REMNANT_SPRITE, BAKEGAERU_CORRUPTED_SPRITE, YODOMI_TREE_SPRITE];
