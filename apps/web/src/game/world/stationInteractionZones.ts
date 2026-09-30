import type { MapId } from "./mapTypes.js";

export function isCookingWorkPosition(mapId: MapId, x: number, y: number) {
  return mapId === "map_nagomi" && x >= 340 && x <= 500 && y >= 350 && y <= 430;
}
