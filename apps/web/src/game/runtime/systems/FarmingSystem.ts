import type { SaveDataV1 } from "@moribito/shared";
import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const CROP_DEFINITIONS = {
  crop_daikon: { name: "大根", seedId: "seed_daikon", harvestId: "item_daikon", matureStage: 4, seedPrice: 20, color: 0xe8d36b },
  crop_carrot: { name: "人参", seedId: "seed_carrot", harvestId: "item_carrot", matureStage: 3, seedPrice: 25, color: 0xe79045 },
  crop_cucumber: { name: "きゅうり", seedId: "seed_cucumber", harvestId: "item_cucumber", matureStage: 4, seedPrice: 30, color: 0x70ad61 },
  crop_eggplant: { name: "なす", seedId: "seed_eggplant", harvestId: "item_eggplant", matureStage: 5, seedPrice: 35, color: 0x8b67a7 },
  crop_pumpkin: { name: "かぼちゃ", seedId: "seed_pumpkin", harvestId: "item_pumpkin", matureStage: 7, seedPrice: 55, color: 0xd59445 },
  crop_rice: { name: "米", seedId: "seed_rice", harvestId: "item_rice", matureStage: 6, seedPrice: 45, color: 0xd8d18a },
} as const;

export type CropId = keyof typeof CROP_DEFINITIONS;
export type SeedId = (typeof CROP_DEFINITIONS)[CropId]["seedId"];
export const cropDefinition = (cropId: string | null | undefined) => cropId && cropId in CROP_DEFINITIONS ? CROP_DEFINITIONS[cropId as CropId] : undefined;
export const cropForSeed = (seedId: string) => (Object.entries(CROP_DEFINITIONS) as [CropId, (typeof CROP_DEFINITIONS)[CropId]][]).find(([, crop]) => crop.seedId === seedId);

export type FarmingAction = "till" | "plant" | "water" | "harvest" | "none";

export class FarmingSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  getPlot(plotId: string) { return this.state().farming.plots.find((plot) => plot.plotId === plotId); }
  availableSeeds() { return (Object.entries(CROP_DEFINITIONS) as [CropId, (typeof CROP_DEFINITIONS)[CropId]][]).filter(([, crop]) => this.inventory.quantity(crop.seedId) > 0); }
  getAction(plotId: string): FarmingAction {
    const plot = this.getPlot(plotId);
    if (!plot) return "till";
    if (!plot.cropId) return this.availableSeeds().length > 0 ? "plant" : "none";
    const crop = cropDefinition(plot.cropId);
    if (crop && plot.growthStage >= crop.matureStage) return "harvest";
    return plot.wateredToday ? "none" : "water";
  }
  act(plotId: string, selectedSeedId?: SeedId) {
    const action = this.getAction(plotId);
    if (action === "none") return action;
    if (action === "till") this.state().farming.plots.push(this.emptyPlot(plotId));
    const plot = this.getPlot(plotId);
    if (!plot) return "none";
    if (action === "plant") {
      const selected = selectedSeedId ? cropForSeed(selectedSeedId) : this.availableSeeds()[0];
      if (!selected || !this.inventory.remove(selected[1].seedId, 1)) return "none";
      plot.cropId = selected[0]; plot.plantedDay = this.state().time.day; plot.growthStage = 1; plot.wateredToday = false;
    }
    if (action === "water") plot.wateredToday = true;
    if (action === "harvest") {
      const crop = cropDefinition(plot.cropId); if (!crop) return "none";
      this.inventory.add(crop.harvestId, 1);
      Object.assign(plot, { cropId: null, plantedDay: null, growthStage: 0, wateredToday: false });
    }
    this.changed("farming");
    return action;
  }
  advanceDay() {
    let changed = false;
    for (const plot of this.state().farming.plots) {
      const crop = cropDefinition(plot.cropId);
      if (crop && plot.wateredToday && plot.growthStage < crop.matureStage) { plot.growthStage += 1; changed = true; }
      if (plot.wateredToday) { plot.wateredToday = false; changed = true; }
    }
    if (changed) this.changed("farming");
  }
  private emptyPlot(plotId: string): SaveDataV1["farming"]["plots"][number] {
    return { plotId, cropId: null, plantedDay: null, growthStage: 0, wateredToday: false };
  }
}
