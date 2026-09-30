import type { ChapterOneStep } from "../runtime/systems/ChapterOneProgressionSystem.js";
import type { ChapterTwoStep } from "../runtime/systems/ChapterTwoProgressionSystem.js";
import type { ChapterThreeStep } from "../runtime/systems/ChapterThreeProgressionSystem.js";
import type { MapId } from "./mapTypes.js";

export const MAP_DISPLAY_NAMES: Record<MapId, string> = {
  map_homestead: "主人公宅の敷地", map_village: "結の村", map_home: "主人公の家",
  map_nagomi: "なごみ亭", map_shop: "万屋", map_forge: "鍛冶屋", map_clinic: "診療所",
  map_village_hall: "村長宅", map_river: "川・釣り場", map_fishing_hut: "漁具小屋",
  map_old_pond: "古池", map_shrine_approach: "神社参道", map_shrine: "結守神社",
  map_forest: "森の入口", map_forest_depths: "迷いの森", map_yodomi_grove: "淀みの大樹",
};

const CHAPTER_ONE_TARGETS: Record<ChapterOneStep, MapId> = {
  meet_shiki: "map_homestead", visit_home: "map_home", try_farming: "map_homestead",
  gather_material: "map_homestead", first_delivery: "map_village", greet_villagers: "map_village",
  visit_shrine: "map_shrine", first_purification: "map_shrine_approach", complete: "map_river",
};
const CHAPTER_TWO_TARGETS: Record<ChapterTwoStep, MapId> = {
  locked: "map_shrine", investigate_water: "map_river", help_villagers: "map_village",
  fulfill_offering: "map_shrine", report_to_shrine: "map_shrine", purify_bakegaeru: "map_old_pond",
  restored_pond: "map_old_pond", complete: "map_village",
};
const CHAPTER_THREE_TARGETS: Record<ChapterThreeStep, MapId> = {
  locked: "map_village", revisit_old_pond: "map_old_pond", ask_yota: "map_village", enter_forest: "map_forest",
  follow_clues: "map_forest_depths", witness_kodama: "map_forest_depths",
  fulfill_offering: "map_shrine",
  purify_tree: "map_yodomi_grove", report_to_shrine: "map_shrine", read_notebook: "map_home", kodama_departure: "map_forest_depths", complete: "map_village",
};

export function objectiveDestination(chapter: 1 | 2 | 3, step: ChapterOneStep | ChapterTwoStep | ChapterThreeStep): MapId {
  if (chapter === 1) return CHAPTER_ONE_TARGETS[step as ChapterOneStep];
  if (chapter === 2) return CHAPTER_TWO_TARGETS[step as ChapterTwoStep];
  return CHAPTER_THREE_TARGETS[step as ChapterThreeStep];
}

export const exitLabel = (targetMap: MapId) => `→ ${MAP_DISPLAY_NAMES[targetMap]}`;

const ROUTES: Record<MapId, readonly MapId[]> = {
  map_homestead: ["map_home", "map_village"], map_home: ["map_homestead"],
  map_village: ["map_homestead", "map_nagomi", "map_shop", "map_forge", "map_clinic", "map_village_hall", "map_river", "map_shrine_approach", "map_forest"],
  map_nagomi: ["map_village"], map_shop: ["map_village"], map_forge: ["map_village"],
  map_clinic: ["map_village"], map_village_hall: ["map_village"],
  map_river: ["map_village", "map_fishing_hut", "map_old_pond"], map_fishing_hut: ["map_river"], map_old_pond: ["map_river"],
  map_shrine_approach: ["map_village", "map_shrine"], map_shrine: ["map_shrine_approach"],
  map_forest: ["map_village", "map_forest_depths"], map_forest_depths: ["map_forest", "map_yodomi_grove"], map_yodomi_grove: ["map_forest_depths"],
};

export function findRoute(from: MapId, to: MapId): MapId[] {
  if (from === to) return [from];
  const queue: MapId[][] = [[from]];
  const visited = new Set<MapId>([from]);
  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) break;
    const current = path[path.length - 1];
    if (!current) continue;
    for (const next of ROUTES[current]) {
      if (visited.has(next)) continue;
      const candidate = [...path, next];
      if (next === to) return candidate;
      visited.add(next);
      queue.push(candidate);
    }
  }
  return [from];
}

export const formatRoute = (route: readonly MapId[]) => route.map((mapId) => MAP_DISPLAY_NAMES[mapId]).join(" → ");

export function nextRouteMap(from: MapId, to: MapId): MapId | undefined {
  return findRoute(from, to)[1];
}
