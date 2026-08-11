import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export class GatheringSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}

  isCollected(mapId: string, nodeId: string) {
    return this.state().world.maps[mapId]?.collectedObjects.includes(nodeId) ?? false;
  }

  collect(mapId: string, nodeId: string, itemId: string, quantity = 1) {
    if (this.isCollected(mapId, nodeId)) return false;
    const mapState = this.state().world.maps[mapId] ?? {
      collectedObjects: [],
      openedChests: [],
      destroyedObjects: [],
      flags: [],
    };
    this.state().world.maps[mapId] = mapState;
    mapState.collectedObjects.push(nodeId);
    this.inventory.add(itemId, quantity);
    this.changed("gathering");
    return true;
  }

  advanceDay() {
    let changed = false;
    for (const map of Object.values(this.state().world.maps)) {
      const remaining = map.collectedObjects.filter((nodeId) => !/^(herb|wood|stone)_/.test(nodeId));
      if (remaining.length === map.collectedObjects.length) continue;
      map.collectedObjects = remaining;
      changed = true;
    }
    if (changed) this.changed("gathering");
    return changed;
  }
}
