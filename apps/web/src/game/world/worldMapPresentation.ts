import type { MapId } from "./mapTypes.js";

export type WorldMapNodeKind = "home" | "village" | "facility" | "nature" | "danger";
export type WorldMapNode = { x: number; y: number; label: string; kind: WorldMapNodeKind };

// Normalized coordinates keep the same geography on desktop and narrow mobile screens.
export const WORLD_MAP_NODES: Record<MapId, WorldMapNode> = {
  map_home: { x: 0.05, y: 0.48, label: "自宅", kind: "home" },
  map_homestead: { x: 0.19, y: 0.48, label: "自宅敷地", kind: "home" },
  map_nagomi: { x: 0.24, y: 0.19, label: "なごみ亭", kind: "facility" },
  map_shop: { x: 0.37, y: 0.19, label: "万屋", kind: "facility" },
  map_forge: { x: 0.5, y: 0.19, label: "鍛冶屋", kind: "facility" },
  map_clinic: { x: 0.63, y: 0.19, label: "診療所", kind: "facility" },
  map_village_hall: { x: 0.76, y: 0.19, label: "村長宅", kind: "facility" },
  map_village: { x: 0.5, y: 0.48, label: "結の村", kind: "village" },
  map_river: { x: 0.31, y: 0.7, label: "川", kind: "nature" },
  map_fishing_hut: { x: 0.16, y: 0.9, label: "漁具小屋", kind: "facility" },
  map_old_pond: { x: 0.35, y: 0.9, label: "古池", kind: "danger" },
  map_shrine_approach: { x: 0.5, y: 0.7, label: "神社参道", kind: "nature" },
  map_shrine: { x: 0.5, y: 0.9, label: "結守神社", kind: "facility" },
  map_forest: { x: 0.7, y: 0.58, label: "森の入口", kind: "nature" },
  map_forest_depths: { x: 0.82, y: 0.72, label: "迷いの森", kind: "danger" },
  map_yodomi_grove: { x: 0.94, y: 0.9, label: "淀みの大樹", kind: "danger" },
};

export const WORLD_MAP_EDGES: readonly (readonly [MapId, MapId])[] = [
  ["map_home", "map_homestead"], ["map_homestead", "map_village"],
  ["map_village", "map_nagomi"], ["map_village", "map_shop"],
  ["map_village", "map_forge"], ["map_village", "map_clinic"],
  ["map_village", "map_village_hall"], ["map_village", "map_river"],
  ["map_river", "map_fishing_hut"], ["map_river", "map_old_pond"],
  ["map_village", "map_shrine_approach"], ["map_shrine_approach", "map_shrine"],
  ["map_village", "map_forest"], ["map_forest", "map_forest_depths"],
  ["map_forest_depths", "map_yodomi_grove"],
];

export function worldMapEdgeKey(a: MapId, b: MapId) {
  return [a, b].sort().join("|");
}

export function routeEdgeKeys(route: readonly MapId[]) {
  const keys = new Set<string>();
  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1];
    const to = route[index];
    if (from && to) keys.add(worldMapEdgeKey(from, to));
  }
  return keys;
}
