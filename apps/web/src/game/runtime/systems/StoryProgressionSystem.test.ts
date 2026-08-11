import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { StoryProgressionSystem } from "./StoryProgressionSystem.js";

describe("StoryProgressionSystem", () => {
  it("completes the life tutorial without skipping chapter progression", () => {
    const state = createInitialState(); const story = new StoryProgressionSystem(() => state, vi.fn());
    story.sync(); expect(story.step).toBe("learn_life");
    state.inventory.items.push({ itemId: "food_simmered_daikon", quantity: 1 }, { itemId: "fish_ayu", quantity: 1 }, { itemId: "medicine_healing", quantity: 1 });
    story.sync(); expect(story.step).toBe("fulfill_offering");
    state.events.flags.push("offering:food_simmered_daikon", "offering:fish_ayu", "offering:medicine_healing");
    story.sync(); expect(story.step).toBe("purify_enemy");
    state.inventory.items.push({ itemId: "material_purified_fragment", quantity: 1 });
    story.sync(); expect(story.step).toBe("complete"); expect(state.progression.chapter).toBe(1); expect(state.progression.storyStep).toBe("prologue_start");
  });
  it("counts already offered items as experienced life activities", () => {
    const state = createInitialState(); state.events.flags.push("offering:food_simmered_daikon", "offering:fish_ayu", "offering:medicine_healing");
    const story = new StoryProgressionSystem(() => state, vi.fn()); story.sync(); story.sync();
    expect(story.step).toBe("purify_enemy");
  });
});
