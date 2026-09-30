import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { FishingSystem } from "./FishingSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("FishingSystem", () => {
  it("adds caught fish and persists the cast sequence", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn());
    const fishing = new FishingSystem(() => state, vi.fn(), inventory);
    expect(fishing.nextCatch).toBe("fish_ayu");
    expect(fishing.cast()).toBe("fish_ayu");
    expect(fishing.nextCatch).toBe("fish_crucian_carp");
    expect(fishing.cast()).toBe("fish_crucian_carp");
    expect(inventory.quantity("fish_ayu")).toBe(1);
    expect(inventory.quantity("fish_crucian_carp")).toBe(1);
    expect(state.events.flags).toContain("fishing_cast_count:2");
  });
  it("cycles through all six first playable fish", () => {
    const state = createInitialState(); const inventory = new InventorySystem(() => state, vi.fn()); const fishing = new FishingSystem(() => state, vi.fn(), inventory);
    const caught = Array.from({ length: 7 }, () => fishing.cast());
    expect(new Set(caught)).toEqual(new Set(["fish_ayu", "fish_crucian_carp", "fish_yamame", "fish_koi", "fish_catfish", "fish_eel"]));
  });
});
