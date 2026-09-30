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

  it("preserves placed furniture coordinates and rotation", () => {
    const result = saveDataV1Schema.parse({
      version: 1, revision: 0, savedAt: "2026-08-21T00:00:00.000Z",
      player: { mapId: "map_home", x: 0, y: 0, direction: "down", money: 0, equippedToolId: null, equippedItemId: null },
      world: { maps: { map_home: { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [{ id: "placed_1", itemId: "furniture_wooden_chair", x: 126, y: 168, rotation: 90 }] } } },
      time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] }, quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] }, progression: { chapter: 1, storyStep: "prologue", unlockedSystems: [], defeatedBosses: [] }
    });
    expect(result.world.maps.map_home?.placedObjects?.[0]).toMatchObject({ x: 126, y: 168, rotation: 90 });
  });

  it("preserves livestock daily state", () => {
    const result = saveDataV1Schema.parse({
      version: 1, revision: 0, savedAt: "2026-08-22T00:00:00.000Z",
      player: { mapId: "map_homestead", x: 0, y: 0, direction: "down", money: 0, equippedToolId: null, equippedItemId: null },
      world: { maps: {} }, time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] }, quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] },
      livestock: { animals: [{ id: "chicken_1", species: "chicken", name: "鶏1", ageDays: 3, friendship: 15, fedToday: false, productReady: true }] },
      progression: { chapter: 1, storyStep: "prologue", unlockedSystems: [], defeatedBosses: [] }
    });
    expect(result.livestock?.animals[0]).toMatchObject({ species: "chicken", ageDays: 3, productReady: true });
  });

  it("preserves owned and equipped yokai cards while accepting legacy saves", () => {
    const base = {
      version: 1 as const, revision: 0, savedAt: "2026-08-22T00:00:00.000Z",
      player: { mapId: "map_home", x: 0, y: 0, direction: "down" as const, money: 0, equippedToolId: null, equippedItemId: null },
      world: { maps: {} }, time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] }, quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] }, progression: { chapter: 1, storyStep: "prologue", unlockedSystems: [], defeatedBosses: [] }
    };
    expect(saveDataV1Schema.parse(base).yokai).toBeUndefined();
    const parsed = saveDataV1Schema.parse({ ...base, yokai: { ownedCards: [{ id: "kappa", rank: 1, friendship: 0, upgrade: 0 }], equippedCardId: "kappa" } });
    expect(parsed.yokai?.equippedCardId).toBe("kappa");
  });
});
