import type { CollisionArea, LoadedMap, MapId } from "./mapTypes.js";

const FACILITIES = new Set<MapId>(["map_nagomi", "map_shop", "map_forge", "map_clinic", "map_village_hall", "map_fishing_hut"]);

/** Use the authored boundary, never a viewport-sized room or equipment hitbox. */
export function interiorRoomPresentation(map: Pick<LoadedMap, "id" | "width" | "height" | "collisions">): { walls: CollisionArea[]; stoneFloor: boolean } | undefined {
  if (!FACILITIES.has(map.id)) return undefined;
  return {
    stoneFloor: map.id === "map_forge",
    walls: map.collisions.filter((area) => area.x === 0 || area.y === 0 || area.x + area.width === map.width || area.y + area.height === map.height),
  };
}
