import { describe, expect, it } from "vitest";
import { dayPeriod, environmentPresentation, weatherForDate } from "./environmentPresentation.js";
describe("environment presentation", () => {
  it("divides a day into four visual periods", () => { expect(dayPeriod(360)).toBe("dawn"); expect(dayPeriod(720)).toBe("day"); expect(dayPeriod(1080)).toBe("dusk"); expect(dayPeriod(1320)).toBe("night"); });
  it("determines stable weather from the date", () => { expect(weatherForDate(1, "spring", 1)).toBe(weatherForDate(1, "spring", 1)); expect(new Set(Array.from({ length: 10 }, (_, i) => weatherForDate(1, "spring", i + 1)))).toEqual(new Set(["sunny", "rain"])); });
  it("keeps facilities free from outdoor dusk tint", () => { expect(environmentPresentation("map_village", { year: 1, season: "spring", day: 1, minutes: 1080 }).alpha).toBeGreaterThan(0); expect(environmentPresentation("map_clinic", { year: 1, season: "spring", day: 1, minutes: 1080 }).alpha).toBe(0); });
});
