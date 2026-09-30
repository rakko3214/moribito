import type { MapId } from "./mapTypes.js";

export type DayPeriod = "dawn" | "day" | "dusk" | "night";
export type Weather = "sunny" | "rain";
export type EnvironmentPresentation = { period: DayPeriod; periodLabel: string; weather: Weather; weatherLabel: string; tint: number; alpha: number; outdoor: boolean };
const INDOOR_MAPS = new Set<MapId>(["map_home", "map_nagomi", "map_shop", "map_forge", "map_clinic", "map_village_hall", "map_fishing_hut"]);
const SEASON_INDEX: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };

export function weatherForDate(year: number, season: string, day: number): Weather {
  return (year * 17 + (SEASON_INDEX[season] ?? 0) * 7 + day) % 5 === 0 ? "rain" : "sunny";
}
export function dayPeriod(minutes: number): DayPeriod {
  const value = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  if (value < 5 * 60 || value >= 20 * 60) return "night";
  if (value < 8 * 60) return "dawn";
  if (value < 17 * 60) return "day";
  return "dusk";
}
export function environmentPresentation(mapId: MapId, time: { year: number; season: string; day: number; minutes: number }): EnvironmentPresentation {
  const period = dayPeriod(time.minutes); const outdoor = !INDOOR_MAPS.has(mapId); const weather = weatherForDate(time.year, time.season, time.day);
  const visuals = { dawn: ["朝", 0xf0b77a, outdoor ? 0.1 : 0], day: ["昼", 0xffffff, 0], dusk: ["夕方", 0xd57d68, outdoor ? 0.14 : 0], night: ["夜", 0x18284f, outdoor ? 0.38 : 0.08] } as const;
  const [periodLabel, tint, alpha] = visuals[period];
  return { period, periodLabel, weather, weatherLabel: weather === "rain" ? "雨" : "晴れ", tint, alpha, outdoor };
}
