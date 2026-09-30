import { NPC_NAMES, type NpcId } from "../runtime/systems/NpcInteractionSystem.js";
import type { NpcPlacement } from "../runtime/systems/NpcScheduleSystem.js";
import type { MapId } from "./mapTypes.js";
import { MAP_DISPLAY_NAMES } from "./navigationGuide.js";

type Facility = { name: string; mapId: MapId; opens: number; closes: number };
const hour = (value: number) => value * 60;
const FACILITIES: readonly Facility[] = [
  { name: "なごみ亭", mapId: "map_nagomi", opens: hour(8), closes: hour(20) },
  { name: "万屋", mapId: "map_shop", opens: hour(8), closes: hour(18) },
  { name: "鍛冶屋", mapId: "map_forge", opens: hour(8), closes: hour(18) },
  { name: "診療所", mapId: "map_clinic", opens: hour(9), closes: hour(21) },
  { name: "村長宅", mapId: "map_village_hall", opens: hour(8), closes: hour(18) },
  { name: "漁具小屋", mapId: "map_fishing_hut", opens: hour(12), closes: hour(16) },
];

const normalizeMinutes = (minutes: number) => ((Math.floor(minutes) % 1440) + 1440) % 1440;

export function openFacilityNames(minutes: number): string[] {
  const current = normalizeMinutes(minutes);
  return FACILITIES.filter((facility) => current >= facility.opens && current < facility.closes).map((facility) => facility.name);
}

export function npcNamesAtMap(placements: readonly NpcPlacement[], mapId: MapId): string[] {
  return placements.filter((placement) => placement.mapId === mapId).map((placement) => NPC_NAMES[placement.id]);
}

export function npcLocationSummary(placements: readonly NpcPlacement[], ids: readonly NpcId[] = ["kaede", "genzo", "tessai", "sogen", "soichiro", "kannushi"]): string {
  const locations = new Map(placements.map((placement) => [placement.id, MAP_DISPLAY_NAMES[placement.mapId]]));
  const visible = ids.flatMap((id) => locations.has(id) ? [`${NPC_NAMES[id]}: ${locations.get(id)}`] : []);
  return visible.length > 0 ? visible.join(" / ") : "勤務時間外";
}
