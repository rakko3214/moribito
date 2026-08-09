import { describe, expect, it } from "vitest";
import { saveDataV1Schema } from "./save.js";

describe("saveDataV1Schema", () => {
  it("accepts a minimal valid save", () => {
    const result = saveDataV1Schema.safeParse({
      version: 1,
      revision: 0,
      savedAt: "2026-08-09T00:00:00.000Z",
      player: { mapId: "map_home", x: 0, y: 0, direction: "down", money: 0, equippedToolId: null, equippedItemId: null },
      world: { maps: {} },
      time: { year: 1, season: "spring", day: 1, minutes: 360 },
      inventory: { items: [], storage: [] },
      quests: { active: [], completedIds: [] },
      events: { flags: [], completedEventIds: [] },
      npcs: { states: {} },
      farming: { plots: [] },
      progression: { chapter: 1, storyStep: "prologue", unlockedSystems: [], defeatedBosses: [] }
    });

    expect(result.success).toBe(true);
  });
});

