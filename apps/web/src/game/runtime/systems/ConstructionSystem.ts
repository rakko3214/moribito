import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";
import { homeUpgradeStage } from "./HomeUpgrade.js";

export type ConstructionId = keyof typeof CONSTRUCTION_PROJECTS;
export type ConstructionBlockReason = "ordered" | "prerequisite" | "money" | "materials";
export type ConstructionAvailability = { canOrder: true } | { canOrder: false; reason: ConstructionBlockReason };

export const CONSTRUCTION_PROJECTS = {
  house_upgrade_1: { kind: "home_upgrade", stage: 1, name: "主人公宅の修繕・増築", money: 500, ingredients: [{ itemId: "item_wood", quantity: 20 }, { itemId: "item_stone", quantity: 10 }] },
  house_upgrade_2: { kind: "home_upgrade", stage: 2, name: "主人公宅の最終増築", money: 1200, ingredients: [{ itemId: "item_wood", quantity: 45 }, { itemId: "item_stone", quantity: 25 }] },
  chicken_coop: { kind: "placeable", name: "鶏小屋", money: 250, ingredients: [{ itemId: "item_wood", quantity: 12 }, { itemId: "item_stone", quantity: 4 }], resultItemId: "building_chicken_coop", size: [4, 3] },
  livestock_barn: { kind: "placeable", name: "家畜小屋", money: 650, ingredients: [{ itemId: "item_wood", quantity: 28 }, { itemId: "item_stone", quantity: 14 }], resultItemId: "building_livestock_barn", size: [5, 4] },
  greenhouse: { kind: "placeable", name: "温室", money: 800, ingredients: [{ itemId: "item_wood", quantity: 24 }, { itemId: "item_stone", quantity: 18 }], resultItemId: "building_greenhouse", size: [5, 4] },
} as const;

export class ConstructionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  isOrdered(id: ConstructionId) {
    const project = CONSTRUCTION_PROJECTS[id];
    return project.kind === "home_upgrade" ? this.homeUpgradeStage() >= project.stage : this.state().events.flags.includes(`construction:ordered:${id}`);
  }
  homeUpgradeStage() { return homeUpgradeStage(this.state().events.flags); }
  availability(id: ConstructionId): ConstructionAvailability {
    const project = CONSTRUCTION_PROJECTS[id];
    if (this.isOrdered(id)) return { canOrder: false, reason: "ordered" };
    if (project.kind === "home_upgrade" && project.stage === 2 && this.homeUpgradeStage() < 1) return { canOrder: false, reason: "prerequisite" };
    if (this.state().player.money < project.money) return { canOrder: false, reason: "money" };
    if (!project.ingredients.every((item) => this.inventory.quantity(item.itemId) >= item.quantity)) return { canOrder: false, reason: "materials" };
    return { canOrder: true };
  }
  canOrder(id: ConstructionId) { return this.availability(id).canOrder; }
  order(id: ConstructionId) {
    if (!this.canOrder(id)) return false;
    const project = CONSTRUCTION_PROJECTS[id];
    for (const item of project.ingredients) this.inventory.remove(item.itemId, item.quantity);
    this.state().player.money -= project.money;
    if (project.kind === "placeable") this.inventory.add(project.resultItemId, 1);
    this.state().events.flags.push(`construction:ordered:${id}`);
    this.changed("progression");
    return true;
  }
}
