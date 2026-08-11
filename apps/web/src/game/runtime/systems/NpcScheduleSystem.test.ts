import { describe, expect, it } from "vitest";
import { getScheduledNpcPlacements } from "./NpcScheduleSystem.js";

describe("NPC schedules", () => {
  it("moves Shiki from the farm to the village during the morning", () => {
    expect(getScheduledNpcPlacements(8 * 60).find((npc) => npc.id === "shiki")).toMatchObject({ x: 520, y: 610 });
    expect(getScheduledNpcPlacements(10 * 60).find((npc) => npc.id === "shiki")).toMatchObject({ x: 700, y: 560 });
  });

  it("moves Genzo from the river to his fishing hut at noon", () => {
    expect(getScheduledNpcPlacements(7 * 60).find((npc) => npc.id === "genzo")).toMatchObject({ x: 640, y: 875 });
    expect(getScheduledNpcPlacements(13 * 60).find((npc) => npc.id === "genzo")).toMatchObject({ x: 760, y: 860 });
  });

  it("removes villagers from public maps after closing time", () => {
    const night = getScheduledNpcPlacements(22 * 60);
    expect(night).toEqual([]);
  });
});
