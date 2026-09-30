import type { MapId } from "./mapTypes.js";

export type MapKind = "homestead" | "interior" | "village" | "life" | "route" | "battle" | "boss";
export type MapMigrationStage = "mock" | "structured" | "art-ready" | "final";
export type MapManifestEntry = { file: string; kind: MapKind; chapter: 1 | 2 | 3; priority: number; stage: MapMigrationStage; requiredObjectLayers: readonly string[] };

const BASE_LAYERS = ["collisions", "spawns", "transitions"] as const;
export const MAP_MANIFEST = {
  map_homestead: { file: "homestead.json", kind: "homestead", chapter: 1, priority: 1, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables", "gatheringNodes", "eventZones"] },
  map_home: { file: "home.json", kind: "interior", chapter: 1, priority: 2, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_village: { file: "village.json", kind: "village", chapter: 1, priority: 3, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_nagomi: { file: "nagomi.json", kind: "interior", chapter: 1, priority: 4, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_shop: { file: "shop.json", kind: "interior", chapter: 2, priority: 5, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_forge: { file: "forge.json", kind: "interior", chapter: 1, priority: 6, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_clinic: { file: "clinic.json", kind: "interior", chapter: 2, priority: 7, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_village_hall: { file: "village-hall.json", kind: "interior", chapter: 1, priority: 8, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "npcSpawns"] },
  map_river: { file: "river.json", kind: "life", chapter: 2, priority: 9, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_fishing_hut: { file: "fishing-hut.json", kind: "interior", chapter: 2, priority: 10, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "npcSpawns"] },
  map_old_pond: { file: "old-pond.json", kind: "boss", chapter: 2, priority: 11, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_shrine_approach: { file: "shrine-approach.json", kind: "battle", chapter: 1, priority: 12, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_shrine: { file: "shrine.json", kind: "interior", chapter: 1, priority: 13, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
  map_forest: { file: "forest.json", kind: "route", chapter: 3, priority: 14, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "eventZones"] },
  map_forest_depths: { file: "forest-depths.json", kind: "battle", chapter: 3, priority: 15, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables", "gatheringNodes"] },
  map_yodomi_grove: { file: "yodomi-grove.json", kind: "boss", chapter: 3, priority: 16, stage: "art-ready", requiredObjectLayers: [...BASE_LAYERS, "interactables"] },
} as const satisfies Record<MapId, MapManifestEntry>;

export const MAP_MIGRATION_ORDER = (Object.entries(MAP_MANIFEST) as [MapId, MapManifestEntry][]).sort((a, b) => a[1].priority - b[1].priority).map(([id]) => id);
