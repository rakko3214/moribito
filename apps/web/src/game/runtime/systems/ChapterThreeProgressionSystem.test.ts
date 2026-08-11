import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ChapterThreeProgressionSystem } from "./ChapterThreeProgressionSystem.js";

describe("ChapterThreeProgressionSystem", () => {
  it("follows Yota, Kodama and the Yodomi Tree through the ending", () => {
    const state = createInitialState(); const chapter = new ChapterThreeProgressionSystem(() => state, vi.fn());
    expect(chapter.step).toBe("locked"); state.quests.completedIds.push("chapter2_bakegaeru"); state.npcs.states.yota = { friendship: 1, flags: [] };
    chapter.recordVisit("map_forest"); state.world.maps.map_forest = { collectedObjects: ["clue_1", "clue_2", "clue_3"], openedChests: [], destroyedObjects: [], flags: [] };
    expect(chapter.step).toBe("witness_kodama"); chapter.recordKodamaEncounter(); expect(chapter.step).toBe("purify_tree");
    chapter.recordTreeCleansed(); expect(chapter.step).toBe("kodama_departure"); expect(chapter.completeDeparture()).toBe(true);
    expect(state.progression.storyStep).toBe("first_playable_complete"); expect(state.progression.defeatedBosses).toContain("boss_yodomi_tree");
  });
});
