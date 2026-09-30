import type { GameplayObjectLayerName, MapGameplayObject } from "./mapObjectLayers.js";

export type MapId = "map_homestead" | "map_village" | "map_home" | "map_nagomi" | "map_shop" | "map_forge" | "map_clinic" | "map_village_hall" | "map_river" | "map_fishing_hut" | "map_old_pond" | "map_shrine_approach" | "map_shrine" | "map_forest" | "map_forest_depths" | "map_yodomi_grove";
export type SpawnPoint = { x: number; y: number };
export type MapTransition = { name: string; x: number; y: number; width: number; height: number; targetMap: MapId; targetSpawn: string };
export type CollisionArea = { x: number; y: number; width: number; height: number };
export type LoadedMap = { id: MapId; displayName: string; background: number; accent: number; width: number; height: number; spawns: Record<string, SpawnPoint>; transitions: MapTransition[]; collisions: CollisionArea[]; objectLayers: Record<GameplayObjectLayerName, MapGameplayObject[]> };
