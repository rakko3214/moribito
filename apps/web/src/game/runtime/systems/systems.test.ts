import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { EventSystem } from "./EventSystem.js";
import { InventorySystem } from "./InventorySystem.js";
import { QuestSystem } from "./QuestSystem.js";
import { TimeSystem } from "./TimeSystem.js";

describe("runtime systems", () => {
  it("advances time across day and season boundaries", () => {
    const state = createInitialState();
    state.time = { year: 1, season: "spring", day: 28, minutes: 1439 };
    new TimeSystem(() => state, vi.fn()).update(1000);
    expect(state.time).toEqual({ year: 1, season: "summer", day: 1, minutes: 0 });
  });

  it("stacks and removes inventory items", () => {
    const state = createInitialState();
    const inventory = new InventorySystem(() => state, vi.fn());
    inventory.add("item_turnip", 3);
    inventory.add("item_turnip", 2);
    expect(inventory.quantity("item_turnip")).toBe(5);
    expect(inventory.remove("item_turnip", 5)).toBe(true);
    expect(state.inventory.items).toEqual([]);
  });

  it("progresses quests and records event flags", () => {
    const state = createInitialState();
    const quests = new QuestSystem(() => state, vi.fn());
    const events = new EventSystem(() => state, vi.fn());
    expect(quests.start("quest_ch01_return")).toBe(true);
    expect(quests.advance("quest_ch01_return", "visit_home", 1)).toBe(true);
    expect(quests.complete("quest_ch01_return")).toBe(true);
    expect(events.setFlag("flag_returned_home")).toBe(true);
    expect(state.quests.completedIds).toContain("quest_ch01_return");
    expect(events.hasFlag("flag_returned_home")).toBe(true);
  });
});
