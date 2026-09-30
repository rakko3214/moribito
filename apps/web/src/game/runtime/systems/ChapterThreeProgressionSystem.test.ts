import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ChapterThreeProgressionSystem } from "./ChapterThreeProgressionSystem.js";

describe("ChapterThreeProgressionSystem", () => {
  it("follows Yota, Kodama and the Yodomi Tree through the ending", () => {
    const state = createInitialState(); let offeringComplete = false; const chapter = new ChapterThreeProgressionSystem(() => state, vi.fn(), () => offeringComplete);
    expect(chapter.step).toBe("locked"); state.quests.completedIds.push("chapter2_bakegaeru");
    expect(chapter.step).toBe("revisit_old_pond"); chapter.recordVisit("map_old_pond"); state.npcs.states.yota = { friendship: 1, flags: [] };
    chapter.recordVisit("map_forest"); state.world.maps.map_forest = { collectedObjects: ["clue_1", "clue_2", "clue_3"], openedChests: [], destroyedObjects: [], flags: [] };
    expect(chapter.step).toBe("witness_kodama"); chapter.recordKodamaEncounter(); expect(chapter.step).toBe("fulfill_offering");
    offeringComplete = true; expect(chapter.step).toBe("purify_tree");
    chapter.recordTreeCleansed(); expect(chapter.step).toBe("report_to_shrine");
    expect(chapter.recordShrineReport()).toBe(true); expect(chapter.step).toBe("read_notebook");
    expect(chapter.recordNotebookRead()).toBe(true); expect(chapter.step).toBe("kodama_departure"); expect(chapter.completeDeparture()).toBe(true);
    expect(state.progression.storyStep).toBe("first_playable_complete"); expect(state.progression.defeatedBosses).toContain("boss_yodomi_tree");
  });
});
