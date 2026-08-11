import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

const REQUIRED = ["food_simmered_daikon", "fish_ayu", "medicine_healing"] as const;
const PREFIX = "offering:";
export class OfferingSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  progress(itemId: string) { return this.state().events.flags.includes(`${PREFIX}${itemId}`) ? 1 : 0; }
  offer(itemId: string) {
    if (!REQUIRED.includes(itemId as typeof REQUIRED[number]) || this.progress(itemId) > 0 || !this.inventory.remove(itemId, 1)) return false;
    this.state().events.flags.push(`${PREFIX}${itemId}`); this.changed("offering"); return true;
  }
  offerNextAvailable() {
    const itemId = REQUIRED.find((id) => this.progress(id) === 0 && this.inventory.quantity(id) > 0);
    return itemId ? (this.offer(itemId) ? itemId : undefined) : undefined;
  }
  isComplete() { return REQUIRED.every((id) => this.progress(id) > 0); }
  get completedCount() { return REQUIRED.filter((id) => this.progress(id) > 0).length; }
}
