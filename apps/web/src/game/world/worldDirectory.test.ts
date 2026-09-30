import { describe, expect, it } from "vitest";
import { getScheduledNpcPlacements } from "../runtime/systems/NpcScheduleSystem.js";
import { npcLocationSummary, npcNamesAtMap, openFacilityNames } from "./worldDirectory.js";

describe("world directory", () => {
  it("shows only facilities that are open at the current time", () => {
    expect(openFacilityNames(10 * 60)).toEqual(["なごみ亭", "万屋", "鍛冶屋", "診療所", "村長宅"]);
    expect(openFacilityNames(20 * 60 + 30)).toEqual(["診療所"]);
    expect(openFacilityNames(23 * 60)).toEqual([]);
  });
  it("lists villagers who are currently on the selected map", () => {
    const placements = getScheduledNpcPlacements(10 * 60);
    expect(npcNamesAtMap(placements, "map_nagomi")).toEqual(["楓"]);
    expect(npcNamesAtMap(placements, "map_village_hall")).toEqual(["宗一郎"]);
  });
  it("summarizes major villager locations", () => {
    expect(npcLocationSummary(getScheduledNpcPlacements(13 * 60), ["genzo", "sogen"])).toBe("源三: 漁具小屋 / 宗玄: 結の村");
    expect(npcLocationSummary([], ["genzo"])).toBe("勤務時間外");
  });
});
