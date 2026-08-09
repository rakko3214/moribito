import type { StateAccessor, StateChanged } from "./types.js";

const SEASONS = ["spring", "summer", "autumn", "winter"];
export type TimeConfig = { realMsPerGameMinute: number };
const DEFAULT_TIME_CONFIG: TimeConfig = { realMsPerGameMinute: 1000 };

export class TimeSystem {
  private elapsedMs = 0;
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly config = DEFAULT_TIME_CONFIG) {}
  update(deltaMs: number) {
    this.elapsedMs += deltaMs;
    const addedMinutes = Math.floor(this.elapsedMs / this.config.realMsPerGameMinute);
    if (addedMinutes === 0) return;
    this.elapsedMs %= this.config.realMsPerGameMinute;
    const time = this.state().time;
    time.minutes += addedMinutes;
    while (time.minutes >= 1440) {
      time.minutes -= 1440;
      time.day += 1;
      if (time.day <= 28) continue;
      time.day = 1;
      const seasonIndex = SEASONS.indexOf(time.season);
      const nextSeason = (seasonIndex + 1) % SEASONS.length;
      time.season = SEASONS[nextSeason] ?? "spring";
      if (nextSeason === 0) time.year += 1;
    }
    this.changed("time");
  }
}
