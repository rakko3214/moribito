import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ChapterTwoProgressionSystem } from "./ChapterTwoProgressionSystem.js";

describe("ChapterTwoProgressionSystem", () => {
  it("connects village life, offerings and Bakegaeru purification", () => {
    const state = createInitialState();
    const chapter = new ChapterTwoProgressionSystem(() => state, vi.fn());
    expect(chapter.step).toBe("locked");
    state.quests.completedIds.push("chapter1_onboarding");
    expect(chapter.step).toBe("investigate_water");
    state.events.flags.push("fishing_cast_count:1");
    state.quests.completedIds.push("request_kaede_daikon", "request_tessai_wood");
    state.events.flags.push("offering:food_simmered_daikon", "offering:fish_ayu", "offering:medicine_healing");
    state.npcs.states.kannushi = { friendship: 1, flags: [] };
    expect(chapter.step).toBe("purify_bakegaeru");
    chapter.recordBossCleansed();
    state.inventory.items.push({ itemId: "material_purified_water", quantity: 1 });
    expect(chapter.sync()).toBe(true);
    expect(state.quests.completedIds).toContain("chapter2_bakegaeru");
    expect(state.progression.defeatedBosses).toContain("boss_bakegaeru");
    expect(state.progression.chapter).toBe(3);
  });

  it("records the boss purification only once", () => {
    const state = createInitialState(); const changed = vi.fn();
    const chapter = new ChapterTwoProgressionSystem(() => state, changed);
    expect(chapter.recordBossCleansed()).toBe(true);
    expect(chapter.recordBossCleansed()).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
  });
});
