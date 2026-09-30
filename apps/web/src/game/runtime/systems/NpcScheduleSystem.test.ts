import { describe, expect, it } from "vitest";
import { getScheduledNpcPlacements } from "./NpcScheduleSystem.js";

describe("NPC schedules", () => {
  it("moves Shiki from the farm to the village during the morning", () => {
    expect(getScheduledNpcPlacements(8 * 60).find((npc) => npc.id === "shiki")).toMatchObject({ mapId: "map_homestead", x: 330, y: 410 });
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "shiki")).toMatchObject({ mapId: "map_village", x: 700, y: 560 });
  });

  it("places Kaede and Tessai inside their workplaces", () => {
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "kaede")?.mapId).toBe("map_nagomi");
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "tessai")?.mapId).toBe("map_forge");
  });

  it("moves Genzo from the river to his fishing hut at noon", () => {
    expect(getScheduledNpcPlacements(7 * 60).find((npc) => npc.id === "genzo")).toMatchObject({ mapId: "map_river", x: 440, y: 380 });
    expect(getScheduledNpcPlacements(13 * 60).find((npc) => npc.id === "genzo")).toMatchObject({ mapId: "map_fishing_hut", x: 320, y: 210 });
  });

  it("places Sogen and Soichiro in their public facilities", () => {
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "sogen")?.mapId).toBe("map_clinic");
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "soichiro")?.mapId).toBe("map_village_hall");
  });

  it("removes villagers from public maps after closing time", () => {
    const night = getScheduledNpcPlacements(22 * 60);
    expect(night).toEqual([]);
  });
});
