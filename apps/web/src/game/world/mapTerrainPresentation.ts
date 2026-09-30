import type { MapId } from "./mapTypes.js";
import { homeUpgradeStage } from "../runtime/systems/HomeUpgrade.js";

export type MapTerrainTexture = { key: string; path: string; tileScale: number };
export type MapWorldSprite = { key: string; path: string; x: number; y: number; width: number; height: number; originY: number; depth: number; collisionNames?: readonly string[] };
export type GatheringSprite = { key: string; path: string; width: number; height: number; originY: number };

const MAP_TERRAIN_TEXTURES: Partial<Record<MapId, MapTerrainTexture>> = {
  map_homestead: { key: "terrain-homestead-grass-v1", path: "/assets/terrain/homestead-grass-v1.png", tileScale: 0.35 },
  map_village: { key: "terrain-village-grass-v1", path: "/assets/terrain/village-grass-v1.png", tileScale: 0.5 },
  map_home: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_nagomi: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_shop: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_forge: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_clinic: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_village_hall: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_fishing_hut: { key: "terrain-interior-tatami-v1", path: "/assets/terrain/interior-tatami-v1.png", tileScale: 0.5 },
  map_shrine_approach: { key: "terrain-shrine-stone-v1", path: "/assets/terrain/shrine-stone-v1.png", tileScale: 0.5 },
  map_shrine: { key: "terrain-shrine-stone-v1", path: "/assets/terrain/shrine-stone-v1.png", tileScale: 0.5 },
  map_river: { key: "terrain-river-water-v1", path: "/assets/terrain/river-water-v1.png", tileScale: 0.5 },
  map_old_pond: { key: "terrain-river-water-v1", path: "/assets/terrain/river-water-v1.png", tileScale: 0.5 },
  map_forest: { key: "terrain-forest-floor-v1", path: "/assets/terrain/forest-floor-v1.png", tileScale: 0.5 },
  map_forest_depths: { key: "terrain-forest-floor-v1", path: "/assets/terrain/forest-floor-v1.png", tileScale: 0.5 },
  map_yodomi_grove: { key: "terrain-forest-floor-v1", path: "/assets/terrain/forest-floor-v1.png", tileScale: 0.5 },
};

const MAP_WORLD_SPRITES: Partial<Record<MapId, readonly MapWorldSprite[]>> = {
  map_homestead: [
    { key: "world-homestead-house-stage1-v1", path: "/assets/world/homestead-house-stage1-v1.png", x: 400, y: 270, width: 270, height: 220, originY: 1, depth: 2, collisionNames: ["house-left", "house-right", "house-top"] },
    { key: "world-homestead-house-stage2-v1", path: "/assets/world/homestead-house-stage2-v1.png", x: 400, y: 270, width: 315, height: 225, originY: 1, depth: 2, collisionNames: ["house-left", "house-right", "house-top"] },
    { key: "world-homestead-house-v1", path: "/assets/world/homestead-house-v1.png", x: 400, y: 270, width: 350, height: 255, originY: 1, depth: 2, collisionNames: ["house-left", "house-right", "house-top"] },
  ],
  map_river: [
    { key: "yokai-kappa-field-v1", path: "/assets/yokai/kappa-field-v1.png", x: 825, y: 425, width: 40, height: 40, originY: 0.9, depth: 3 },
    { key: "world-river-fishing-hut-v1", path: "/assets/world/river-fishing-hut-v1.png", x: 245, y: 265, width: 250, height: 190, originY: 1, depth: 2, collisionNames: ["fishing-hut-left", "fishing-hut-right", "fishing-hut-top"] },
    { key: "world-river-bank-v1", path: "/assets/world/river-bank-v1.png", x: 480, y: 620, width: 780, height: 145, originY: 1, depth: 1, collisionNames: ["river-water"] },
  ],
  map_shrine_approach: [
    { key: "world-shrine-torii-v1", path: "/assets/world/shrine-torii-v1.png", x: 480, y: 175, width: 220, height: 180, originY: 1, depth: 2 },
    { key: "world-shrine-lantern-pair-v1", path: "/assets/world/shrine-lantern-pair-v1.png", x: 480, y: 355, width: 240, height: 160, originY: 1, depth: 2 },
  ],
  map_old_pond: [
    { key: "world-old-pond-bank-v1", path: "/assets/world/old-pond-bank-v1.png", x: 480, y: 575, width: 420, height: 300, originY: 1, depth: 1 },
  ],
  map_forest: [
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 230, y: 205, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["grove-a"] },
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 455, y: 425, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["grove-b"] },
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 730, y: 235, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["grove-c"] },
  ],
  map_village: [
    { key: "world-village-shop-v1", path: "/assets/world/village-shop-v1.png", x: 245, y: 405, width: 230, height: 180, originY: 1, depth: 2, collisionNames: ["shop"] },
    { key: "world-village-nagomi-v1", path: "/assets/world/village-nagomi-v1.png", x: 1035, y: 405, width: 230, height: 180, originY: 1, depth: 2, collisionNames: ["teahouse"] },
    { key: "world-village-forge-v1", path: "/assets/world/village-forge-v1.png", x: 510, y: 445, width: 200, height: 175, originY: 1, depth: 2, collisionNames: ["forge"] },
    { key: "world-village-clinic-v1", path: "/assets/world/village-clinic-v1.png", x: 245, y: 640, width: 230, height: 180, originY: 1, depth: 2, collisionNames: ["clinic"] },
    { key: "world-village-hall-v1", path: "/assets/world/village-hall-v1.png", x: 1035, y: 640, width: 230, height: 180, originY: 1, depth: 2, collisionNames: ["village-hall"] },
  ],
  map_shrine: [
    { key: "world-shrine-main-hall-v1", path: "/assets/world/shrine-main-hall-v1.png", x: 384, y: 235, width: 328, height: 200, originY: 1, depth: 2, collisionNames: ["main-hall"] },
  ],
  map_nagomi: [
    { key: "world-interior-nagomi-v1", path: "/assets/world/interior-nagomi-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1, collisionNames: ["kitchen-back", "prep-counter"] },
  ],
  map_shop: [
    { key: "world-interior-shop-v1", path: "/assets/world/interior-shop-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1 },
  ],
  map_forge: [
    { key: "world-interior-forge-v1", path: "/assets/world/interior-forge-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1 },
  ],
  map_clinic: [
    { key: "world-interior-clinic-v1", path: "/assets/world/interior-clinic-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1 },
  ],
  map_village_hall: [
    { key: "world-interior-village-hall-v1", path: "/assets/world/interior-village-hall-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1 },
  ],
  map_fishing_hut: [
    { key: "world-interior-fishing-hut-v1", path: "/assets/world/interior-fishing-hut-v1.png", x: 320, y: 350, width: 520, height: 270, originY: 1, depth: 1 },
  ],
  map_forest_depths: [
    { key: "yokai-kodama-field-v1", path: "/assets/yokai/kodama-field-v1.png", x: 690, y: 500, width: 40, height: 48, originY: 0.94, depth: 3 },
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 250, y: 285, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["trees-a"] },
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 485, y: 480, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["trees-b"] },
    { key: "world-forest-grove-v1", path: "/assets/world/forest-grove-v1.png", x: 725, y: 315, width: 180, height: 190, originY: 1, depth: 2, collisionNames: ["trees-c"] },
  ],
};

const GATHERING_SPRITES: Partial<Record<string, GatheringSprite>> = {
  tool_axe: { key: "world-harvest-tree-v1", path: "/assets/world/harvest-tree-v1.png", width: 94, height: 112, originY: 0.9 },
  tool_pickaxe: { key: "world-field-rock-v1", path: "/assets/world/field-rock-v1.png", width: 52, height: 52, originY: 0.72 },
};

export const mapTerrainTexture = (mapId: MapId) => MAP_TERRAIN_TEXTURES[mapId];
export const terrainTextures = () => [...new Map(Object.values(MAP_TERRAIN_TEXTURES).map((texture) => [texture.key, texture])).values()];
export const mapWorldSprites = (mapId: MapId, flags: readonly string[] = []) => {
  const sprites = MAP_WORLD_SPRITES[mapId] ?? [];
  const stage = homeUpgradeStage(flags);
  return mapId === "map_homestead" ? sprites.slice(stage, stage + 1) : sprites;
};
export const gatheringSprite = (requiredTool: string | undefined) => requiredTool ? GATHERING_SPRITES[requiredTool] : undefined;
export const worldSpriteTextures = () => [
  ...Object.values(MAP_WORLD_SPRITES).filter((sprites): sprites is readonly MapWorldSprite[] => Boolean(sprites)).flat(),
  ...Object.values(GATHERING_SPRITES).filter((sprite): sprite is GatheringSprite => Boolean(sprite)),
].filter((sprite, index, sprites) => sprites.findIndex((candidate) => candidate.key === sprite.key) === index);
