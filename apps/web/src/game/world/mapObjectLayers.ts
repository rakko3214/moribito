export const GAMEPLAY_OBJECT_LAYERS = ["interactables", "npcSpawns", "eventZones", "gatheringNodes", "fishingSpots", "enemySpawnCandidates", "cameraZones", "audioZones"] as const;
export type GameplayObjectLayerName = typeof GAMEPLAY_OBJECT_LAYERS[number];
export type MapGameplayObject = { id: number; name: string; type: string; x: number; y: number; width: number; height: number; properties: Record<string, unknown> };
export type TiledObjectLike = { id?: number; name?: string; type?: string; x?: number; y?: number; width?: number; height?: number; properties?: Array<{ name: string; value: unknown }> };

export function parseGameplayObjects(objects: readonly TiledObjectLike[] = []): MapGameplayObject[] {
  return objects.map((object) => ({ id: object.id ?? 0, name: object.name ?? "", type: object.type ?? "", x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? 0, height: object.height ?? 0, properties: Object.fromEntries((object.properties ?? []).map((item) => [item.name, item.value])) }));
}
