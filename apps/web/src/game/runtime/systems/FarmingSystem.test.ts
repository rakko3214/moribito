import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { FarmingSystem } from "./FarmingSystem.js";
import { InventorySystem } from "./InventorySystem.js";

describe("FarmingSystem", () => {
  it("runs the till, plant, water, grow and harvest loop", () => {
    const state = createInitialState();
    state.inventory.items.push({ itemId: "seed_daikon", quantity: 1 });
    const changed = vi.fn();
    const inventory = new InventorySystem(() => state, changed);
    const farming = new FarmingSystem(() => state, changed, inventory);
    expect(farming.act("farm_1")).toBe("till");
    expect(farming.act("farm_1")).toBe("plant");
    for (let stage = 1; stage < 4; stage += 1) {
      expect(farming.act("farm_1")).toBe("water");
      farming.advanceDay();
    }
    expect(farming.getAction("farm_1")).toBe("harvest");
    expect(farming.act("farm_1")).toBe("harvest");
    expect(inventory.quantity("item_daikon")).toBe(1);
    expect(farming.getPlot("farm_1")).toMatchObject({ cropId: null, growthStage: 0 });
  });

  it("does not grow an unwatered crop", () => {
    const state = createInitialState();
    state.farming.plots.push({ plotId: "farm_1", cropId: "crop_daikon", plantedDay: 1, growthStage: 1, wateredToday: false });
    const inventory = new InventorySystem(() => state, vi.fn());
    const farming = new FarmingSystem(() => state, vi.fn(), inventory);
    farming.advanceDay();
    expect(farming.getPlot("farm_1")?.growthStage).toBe(1);
  });
});
