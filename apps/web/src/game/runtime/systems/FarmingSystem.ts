import type { SaveDataV1 } from "@moribito/shared";
import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

const CROP_ID = "crop_daikon";
const SEED_ID = "seed_daikon";
const HARVEST_ID = "item_daikon";
const MATURE_STAGE = 4;

export type FarmingAction = "till" | "plant" | "water" | "harvest" | "none";

export class FarmingSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  getPlot(plotId: string) { return this.state().farming.plots.find((plot) => plot.plotId === plotId); }
  getAction(plotId: string): FarmingAction {
    const plot = this.getPlot(plotId);
    if (!plot) return "till";
    if (!plot.cropId) return this.inventory.quantity(SEED_ID) > 0 ? "plant" : "none";
    if (plot.growthStage >= MATURE_STAGE) return "harvest";
    return plot.wateredToday ? "none" : "water";
  }
  act(plotId: string) {
    const action = this.getAction(plotId);
    if (action === "none") return action;
    if (action === "till") this.state().farming.plots.push(this.emptyPlot(plotId));
    const plot = this.getPlot(plotId);
    if (!plot) return "none";
    if (action === "plant" && this.inventory.remove(SEED_ID, 1)) {
      plot.cropId = CROP_ID; plot.plantedDay = this.state().time.day; plot.growthStage = 1; plot.wateredToday = false;
    }
    if (action === "water") plot.wateredToday = true;
    if (action === "harvest") {
      this.inventory.add(HARVEST_ID, 1);
      Object.assign(plot, { cropId: null, plantedDay: null, growthStage: 0, wateredToday: false });
    }
    this.changed("farming");
    return action;
  }
  advanceDay() {
    let changed = false;
    for (const plot of this.state().farming.plots) {
      if (plot.cropId && plot.wateredToday && plot.growthStage < MATURE_STAGE) { plot.growthStage += 1; changed = true; }
      if (plot.wateredToday) { plot.wateredToday = false; changed = true; }
    }
    if (changed) this.changed("farming");
  }
  private emptyPlot(plotId: string): SaveDataV1["farming"]["plots"][number] {
    return { plotId, cropId: null, plantedDay: null, growthStage: 0, wateredToday: false };
  }
}
