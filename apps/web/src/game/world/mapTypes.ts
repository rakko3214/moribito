export type MapId = "map_village" | "map_home" | "map_shrine";
export type SpawnPoint = { x: number; y: number };
export type MapTransition = { name: string; x: number; y: number; width: number; height: number; targetMap: MapId; targetSpawn: string };
export type CollisionArea = { x: number; y: number; width: number; height: number };
export type LoadedMap = { id: MapId; displayName: string; background: number; accent: number; width: number; height: number; spawns: Record<string, SpawnPoint>; transitions: MapTransition[]; collisions: CollisionArea[] };
