import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

const CATCHES = ["fish_ayu", "fish_crucian_carp", "fish_ayu"] as const;
const COUNT_PREFIX = "fishing_cast_count:";

export class FishingSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  cast() {
    const flags = this.state().events.flags;
    const current = flags.find((flag) => flag.startsWith(COUNT_PREFIX));
    const count = current ? Number(current.slice(COUNT_PREFIX.length)) || 0 : 0;
    if (current) flags.splice(flags.indexOf(current), 1);
    flags.push(`${COUNT_PREFIX}${count + 1}`);
    const fishId = CATCHES[count % CATCHES.length] ?? "fish_ayu";
    this.inventory.add(fishId, 1);
    this.changed("fishing");
    return fishId;
  }
}
