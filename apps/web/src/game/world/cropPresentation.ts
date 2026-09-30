export const FARM_SPRITE_SHEET = {
  key: "world-farm-crops-resources-v1",
  path: "/assets/world/farm-crops-resources-v1.png",
  frameWidth: 256,
  frameHeight: 256,
} as const;

export const FARM_EXPANDED_SPRITE_SHEET = {
  key: "world-farm-crops-expanded-v1",
  path: "/assets/world/farm-crops-expanded-v1.png",
  frameWidth: 256,
  frameHeight: 256,
} as const;

const CROP_ROW: Readonly<Record<string, number>> = {
  crop_daikon: 0,
  crop_cucumber: 1,
};

const EXPANDED_CROP_ROW: Readonly<Record<string, number>> = {
  crop_carrot: 0,
  crop_eggplant: 1,
  crop_pumpkin: 2,
  crop_rice: 3,
};

export type CropSpritePresentation = { textureKey: string; frame: number };

const visualStage = (growthStage: number, matureStage: number) => {
  const normalizedStage = Math.max(1, Math.min(growthStage, matureStage));
  return Math.min(3, Math.floor(((normalizedStage - 1) * 3) / Math.max(1, matureStage - 1)));
};

export const cropSpritePresentation = (cropId: string, growthStage: number, matureStage: number): CropSpritePresentation => {
  const expandedRow = EXPANDED_CROP_ROW[cropId];
  if (expandedRow !== undefined) return { textureKey: FARM_EXPANDED_SPRITE_SHEET.key, frame: expandedRow * 4 + visualStage(growthStage, matureStage) };
  return { textureKey: FARM_SPRITE_SHEET.key, frame: (CROP_ROW[cropId] ?? 0) * 4 + visualStage(growthStage, matureStage) };
};

export const cropSpriteFrame = (cropId: string, growthStage: number, matureStage: number) => cropSpritePresentation(cropId, growthStage, matureStage).frame;
