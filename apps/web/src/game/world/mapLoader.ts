import type Phaser from "phaser";
import type { CollisionArea, LoadedMap, MapId, MapTransition } from "./mapTypes.js";

const MAP_KEYS: Record<MapId, string> = { map_village: "map-village", map_home: "map-home", map_shrine: "map-shrine", map_forest: "map-forest" };

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
  return { id, displayName: String(property(map, "displayName") ?? id), background: color(map, "background", 0x243d30), accent: color(map, "accent", 0x92a86f), width: map.widthInPixels, height: map.heightInPixels, spawns, transitions, collisions };
}
