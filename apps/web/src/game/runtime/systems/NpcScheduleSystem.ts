import type { MapId } from "../../world/mapTypes.js";
import type { NpcId } from "./NpcInteractionSystem.js";

export type NpcPlacement = { id: NpcId; mapId: MapId; x: number; y: number };
type ScheduleEntry = NpcPlacement & { start: number; end: number };

const hour = (value: number) => value * 60;
const SCHEDULES: readonly ScheduleEntry[] = [
  { id: "shiki", mapId: "map_village", x: 520, y: 610, start: hour(6), end: hour(9) },
  { id: "shiki", mapId: "map_village", x: 700, y: 560, start: hour(9), end: hour(18) },
  { id: "kaede", mapId: "map_village", x: 1035, y: 465, start: hour(8), end: hour(20) },
  { id: "genzo", mapId: "map_village", x: 640, y: 875, start: hour(5), end: hour(12) },
  { id: "genzo", mapId: "map_village", x: 760, y: 860, start: hour(12), end: hour(18) },
  { id: "tessai", mapId: "map_village", x: 430, y: 450, start: hour(8), end: hour(18) },
  { id: "yota", mapId: "map_village", x: 1120, y: 610, start: hour(8), end: hour(18) },
  { id: "kannushi", mapId: "map_shrine", x: 560, y: 300, start: hour(6), end: hour(20) },
];

export function getScheduledNpcPlacements(minutes: number): NpcPlacement[] {
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  return SCHEDULES.filter(({ start, end }) => normalized >= start && normalized < end)
    .map(({ id, mapId, x, y }) => ({ id, mapId, x, y }));
}
