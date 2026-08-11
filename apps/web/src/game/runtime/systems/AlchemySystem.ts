import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export class AlchemySystem {
  constructor(private readonly _state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  canCraft() { return this.inventory.quantity("item_yomogi") >= 1; }
  craft() {
    if (!this.canCraft() || !this.inventory.remove("item_yomogi", 1)) return false;
    this.inventory.add("medicine_healing", 1); this.changed("alchemy"); return true;
  }
}
