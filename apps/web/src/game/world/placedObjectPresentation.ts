export const CRAFTABLE_SPRITE_SHEET = { key: "world-placeable-craftables-v1", path: "/assets/world/placeable-craftables-v1.png", frameWidth: 384, frameHeight: 512 } as const;
export const FARM_BUILDING_SPRITE_SHEET = { key: "world-placeable-farm-buildings-v1", path: "/assets/world/placeable-farm-buildings-v1.png", frameWidth: 724, frameHeight: 724 } as const;
export const HOME_ESSENTIAL_SPRITE_SHEET = { key: "world-home-essential-furniture-v1", path: "/assets/world/home-essential-furniture-v1.png", frameWidth: 887, frameHeight: 887 } as const;

export type PlacedObjectSprite = { textureKey: string; frame: number; heightScale: number };
const SPRITES: Readonly<Record<string, PlacedObjectSprite>> = {
  furniture_bed: { textureKey: HOME_ESSENTIAL_SPRITE_SHEET.key, frame: 0, heightScale: 0.85 },
  furniture_workbench: { textureKey: HOME_ESSENTIAL_SPRITE_SHEET.key, frame: 1, heightScale: 1.1 },
  furniture_wooden_chair: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 0, heightScale: 1.25 },
  furniture_wooden_table: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 1, heightScale: 0.7 },
  furniture_storage_box: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 2, heightScale: 1 },
  placeable_livestock_fence: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 3, heightScale: 0.75 },
  placeable_fence_gate: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 4, heightScale: 1 },
  placeable_feed_trough: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 5, heightScale: 0.62 },
  placeable_water_trough: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 6, heightScale: 0.62 },
  placeable_wooden_sign: { textureKey: CRAFTABLE_SPRITE_SHEET.key, frame: 7, heightScale: 1.15 },
  building_chicken_coop: { textureKey: FARM_BUILDING_SPRITE_SHEET.key, frame: 0, heightScale: 1.05 },
  building_livestock_barn: { textureKey: FARM_BUILDING_SPRITE_SHEET.key, frame: 1, heightScale: 0.9 },
  building_greenhouse: { textureKey: FARM_BUILDING_SPRITE_SHEET.key, frame: 2, heightScale: 0.9 },
};

export const placedObjectSprite = (itemId: string) => SPRITES[itemId];
export const placedObjectBlocksMovement = (itemId: string, active = false) => itemId !== "placeable_fence_gate" || !active;
export const placedObjectDisplaySize = (itemId: string, footprintWidth: number, footprintHeight: number) => {
  const sprite = placedObjectSprite(itemId);
  return { width: footprintWidth, height: sprite ? Math.max(footprintHeight, footprintWidth * sprite.heightScale) : footprintHeight };
};
