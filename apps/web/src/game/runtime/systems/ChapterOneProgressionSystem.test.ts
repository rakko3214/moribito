import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { ChapterOneProgressionSystem } from "./ChapterOneProgressionSystem.js";

describe("ChapterOneProgressionSystem", () => {
  it("guides the player through the chapter one onboarding", () => {
    const state = createInitialState();
    const chapter = new ChapterOneProgressionSystem(() => state, vi.fn());
    expect(chapter.step).toBe("meet_shiki");
    expect(chapter.storyBeat).toContain("守人村へ帰郷");
    state.npcs.states.shiki = { friendship: 1, flags: [] };
    expect(chapter.step).toBe("visit_home");
    chapter.recordVisit("map_home");
    state.farming.plots.push({ plotId: "farm_1", cropId: null, plantedDay: null, growthStage: 0, wateredToday: false });
    state.world.maps.map_village = { collectedObjects: ["wood_1"], openedChests: [], destroyedObjects: [], flags: [] };
    state.quests.completedIds.push("request_tessai_wood");
    for (const id of ["kaede", "genzo", "tessai"] as const) state.npcs.states[id] = { friendship: 1, flags: [] };
    chapter.recordVisit("map_shrine");
    expect(chapter.step).toBe("first_purification");
    state.inventory.items.push({ itemId: "material_purified_fragment", quantity: 1 });
    expect(chapter.sync()).toBe(true);
    expect(state.progression.chapter).toBe(2);
    expect(state.quests.completedIds).toContain("chapter1_onboarding");
    expect(chapter.storyBeat).toContain("結師代理");
  });

  it("records each chapter location once", () => {
    const state = createInitialState();
    const changed = vi.fn();
    const chapter = new ChapterOneProgressionSystem(() => state, changed);
    expect(chapter.recordVisit("map_home")).toBe(true);
    expect(chapter.recordVisit("map_home")).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
  });
});
