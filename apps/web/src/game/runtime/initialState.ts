import type { SaveDataV1 } from "@moribito/shared";

export function createInitialState(now = new Date()): SaveDataV1 {
  return {
    version: 1,
    revision: 0,
    savedAt: now.toISOString(),
    player: { mapId: "map_homestead", x: 400, y: 360, direction: "down", money: 500, equippedToolId: "tool_hoe", equippedItemId: null },
    world: { maps: {} },
    time: { year: 1, season: "spring", day: 1, minutes: 6 * 60 },
    inventory: { items: [], storage: [] },
    quests: { active: [], completedIds: [] },
    events: { flags: [], completedEventIds: [] },
    npcs: { states: {} },
    farming: { plots: [] },
    livestock: { animals: [] },
    yokai: { ownedCards: [], equippedCardId: null },
    progression: { chapter: 1, storyStep: "prologue_start", unlockedSystems: ["movement"], defeatedBosses: [] },
  };
}
