import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

const REQUIRED = ["food_simmered_daikon", "fish_ayu", "medicine_healing"] as const;
const PREFIX = "offering:";
const CHAPTER_THREE_PREFIX = "chapter3:offering:";
const FISH_DISHES = new Set(["food_grilled_ayu"]);
const GATHERED_DISHES = new Set(["food_herb_rice"]);
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
  offerChapterThree(itemId: string) {
    if (!itemId.startsWith("food_") || itemId === "food_failed_dish" || !this.inventory.remove(itemId, 1)) return false;
    const sequence = this.chapterThreeOfferings.length + 1;
    this.state().events.flags.push(`${CHAPTER_THREE_PREFIX}${sequence}:${itemId}`);
    this.changed("offering"); return true;
  }
  get chapterThreeOfferings() {
    return this.state().events.flags.filter((flag) => flag.startsWith(CHAPTER_THREE_PREFIX)).map((flag) => flag.split(":").slice(3).join(":"));
  }
  get chapterThreeProgress() {
    const offerings = this.chapterThreeOfferings;
    return {
      total: offerings.length,
      varieties: new Set(offerings).size,
      fish: offerings.filter((id) => FISH_DISHES.has(id)).length,
      gathered: offerings.filter((id) => GATHERED_DISHES.has(id)).length,
    };
  }
  get isChapterThreeComplete() {
    const progress = this.chapterThreeProgress;
    return progress.total >= 10 && progress.varieties >= 4 && progress.fish >= 1 && progress.gathered >= 2;
  }
}
