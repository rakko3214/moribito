import type Phaser from "phaser";
import type { CollisionArea, LoadedMap, MapId, MapTransition } from "./mapTypes.js";
import { MAP_DISPLAY_NAMES } from "./navigationGuide.js";
import { GAMEPLAY_OBJECT_LAYERS, parseGameplayObjects } from "./mapObjectLayers.js";

const MAP_KEYS: Record<MapId, string> = {
  map_homestead: "map-homestead", map_village: "map-village", map_home: "map-home",
  map_nagomi: "map-nagomi", map_shop: "map-shop", map_forge: "map-forge",
  map_clinic: "map-clinic", map_village_hall: "map-village-hall",
  map_river: "map-river", map_fishing_hut: "map-fishing-hut",
  map_old_pond: "map-old-pond",
  map_shrine_approach: "map-shrine-approach",
  map_forest_depths: "map-forest-depths", map_yodomi_grove: "map-yodomi-grove",
  map_shrine: "map-shrine", map_forest: "map-forest",
};

function property(map: Phaser.Tilemaps.Tilemap, name: string) {
  const properties = Array.isArray(map.properties) ? map.properties as Array<{ name: string; value: unknown }> : [];
  return properties.find((item) => item.name === name)?.value;
}
function color(map: Phaser.Tilemaps.Tilemap, name: string, fallback: number) {
  const raw = property(map, name);
  return typeof raw === "string" ? Number.parseInt(raw.replace("#", ""), 16) : fallback;
}
export function loadTiledMap(scene: Phaser.Scene, id: MapId): LoadedMap {
  const map = scene.make.tilemap({ key: MAP_KEYS[id] });
  const spawns: Record<string, { x: number; y: number }> = {};
  for (const object of map.getObjectLayer("spawns")?.objects ?? []) if (object.name) spawns[object.name] = { x: object.x ?? 0, y: object.y ?? 0 };
  const transitions: MapTransition[] = (map.getObjectLayer("transitions")?.objects ?? []).map((object) => {
    const props = Object.fromEntries((object.properties ?? []).map((item: { name: string; value: unknown }) => [item.name, item.value]));
    return { name: object.name, x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? 0, height: object.height ?? 0, targetMap: props.targetMap as MapId, targetSpawn: String(props.targetSpawn) };
  });
  const collisions: CollisionArea[] = (map.getObjectLayer("collisions")?.objects ?? []).map((object) => ({ x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? 0, height: object.height ?? 0 }));
  const objectLayers = Object.fromEntries(GAMEPLAY_OBJECT_LAYERS.map((name) => [name, parseGameplayObjects(map.getObjectLayer(name)?.objects ?? [])])) as LoadedMap["objectLayers"];
  return { id, displayName: MAP_DISPLAY_NAMES[id] ?? String(property(map, "displayName") ?? id), background: color(map, "background", 0x243d30), accent: color(map, "accent", 0x92a86f), width: map.widthInPixels, height: map.heightInPixels, spawns, transitions, collisions, objectLayers };
}
