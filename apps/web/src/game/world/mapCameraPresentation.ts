import type { MapId } from "./mapTypes.js";

const INTERIOR_MAPS = new Set<MapId>([
  "map_home", "map_nagomi", "map_shop", "map_forge", "map_clinic", "map_village_hall", "map_fishing_hut",
]);

export function mapCameraZoom(_mapId: MapId, _viewportHeight: number, _mapHeight: number) {
  // Keep the camera API stable; authored pixels and screen-space UI use unit zoom.
  void _mapId;
  void _viewportHeight;
  void _mapHeight;
  return 1;
}

export function mapFloorExtent(mapId: MapId, mapWidth: number, mapHeight: number, viewportWidth: number, viewportHeight: number) {
  if (!INTERIOR_MAPS.has(mapId)) return { width: mapWidth, height: mapHeight };
  return { width: Math.max(mapWidth, viewportWidth), height: Math.max(mapHeight, viewportHeight) };
}

export function centeredCameraBounds(mapWidth: number, mapHeight: number, viewportWidth: number, viewportHeight: number) {
  const width = Math.max(mapWidth, viewportWidth);
  const height = Math.max(mapHeight, viewportHeight);
  return { x: (mapWidth - width) / 2, y: (mapHeight - height) / 2, width, height };
}
