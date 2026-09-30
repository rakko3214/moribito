import type { MapId } from "../../world/mapTypes.js";
import type { NpcId } from "./NpcInteractionSystem.js";

export type NpcPlacement = { id: NpcId; mapId: MapId; x: number; y: number };
type ScheduleEntry = NpcPlacement & { start: number; end: number };

const hour = (value: number) => value * 60;
const SCHEDULES: readonly ScheduleEntry[] = [
  { id: "shiki", mapId: "map_homestead", x: 330, y: 410, start: hour(6), end: hour(9) },
  { id: "shiki", mapId: "map_village", x: 700, y: 560, start: hour(9), end: hour(18) },
  { id: "kaede", mapId: "map_nagomi", x: 535, y: 400, start: hour(8), end: hour(20) },
  { id: "genzo", mapId: "map_river", x: 440, y: 380, start: hour(5), end: hour(12) },
  { id: "genzo", mapId: "map_fishing_hut", x: 320, y: 210, start: hour(12), end: hour(16) },
  { id: "genzo", mapId: "map_river", x: 700, y: 370, start: hour(16), end: hour(18) },
  { id: "tessai", mapId: "map_forge", x: 490, y: 355, start: hour(8), end: hour(18) },
  { id: "sogen", mapId: "map_homestead", x: 570, y: 350, start: hour(7), end: hour(9) },
  { id: "sogen", mapId: "map_clinic", x: 220, y: 190, start: hour(9), end: hour(13) },
  { id: "sogen", mapId: "map_village", x: 760, y: 650, start: hour(13), end: hour(17) },
  { id: "sogen", mapId: "map_clinic", x: 220, y: 190, start: hour(17), end: hour(21) },
  { id: "soichiro", mapId: "map_village_hall", x: 320, y: 210, start: hour(8), end: hour(18) },
  { id: "soichiro", mapId: "map_village", x: 1035, y: 720, start: hour(18), end: hour(20) },
  { id: "yota", mapId: "map_village", x: 1120, y: 610, start: hour(8), end: hour(18) },
  { id: "kannushi", mapId: "map_shrine", x: 560, y: 300, start: hour(6), end: hour(20) },
];

export function getScheduledNpcPlacements(minutes: number): NpcPlacement[] {
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  return SCHEDULES.filter(({ start, end }) => normalized >= start && normalized < end)
    .map(({ id, mapId, x, y }) => ({ id, mapId, x, y }));
}
