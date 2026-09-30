import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type GatheringMaterial = {
  name: string;
  habitat: "homestead" | "forest" | "river";
  renewable: boolean;
  use: string;
};

export const GATHERING_MATERIALS: Record<string, GatheringMaterial> = {
  item_wood: { name: "木材", habitat: "homestead", renewable: false, use: "建築・家具・依頼" },
  item_stone: { name: "石材", habitat: "homestead", renewable: false, use: "建築・鍛冶・依頼" },
  item_yomogi: { name: "よもぎ", habitat: "homestead", renewable: true, use: "料理・調合" },
  item_mushroom: { name: "森きのこ", habitat: "forest", renewable: true, use: "料理・調合" },
  item_mountain_greens: { name: "山菜", habitat: "forest", renewable: true, use: "料理・依頼" },
  item_river_algae: { name: "川藻", habitat: "river", renewable: true, use: "調合・奉納" },
  item_spring_water: { name: "清水", habitat: "river", renewable: true, use: "調合・料理" },
  item_spirit_acorn: { name: "霊木の実", habitat: "forest", renewable: true, use: "上級調合・奉納" },
};

export class GatheringSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}

  isCollected(mapId: string, nodeId: string) {
    return this.state().world.maps[mapId]?.collectedObjects.includes(nodeId) ?? false;
  }
  isDestroyed(mapId: string, nodeId: string) { return this.state().world.maps[mapId]?.destroyedObjects.includes(nodeId) ?? false; }

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
    if (GATHERING_MATERIALS[itemId]?.renewable) mapState.flags.push(`gathered:${nodeId}:${itemId}`);
    this.inventory.add(itemId, quantity);
    this.changed("gathering");
    return true;
  }
  destroy(mapId: string, nodeId: string, itemId: string, quantity = 1) {
    if (this.isDestroyed(mapId, nodeId)) return false;
    const mapState = this.state().world.maps[mapId] ?? { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [] };
    this.state().world.maps[mapId] = mapState;
    mapState.destroyedObjects.push(nodeId);
    this.inventory.add(itemId, quantity);
    this.changed("gathering");
    return true;
  }

  advanceDay() {
    let changed = false;
    for (const map of Object.values(this.state().world.maps)) {
      const renewableNodeIds = map.collectedObjects.filter((nodeId) => {
        const itemId = map.flags?.find((flag) => flag.startsWith(`gathered:${nodeId}:`))?.split(":")[2];
        return itemId ? GATHERING_MATERIALS[itemId]?.renewable === true : /^(herb|mushroom|greens|algae|water|acorn)_/.test(nodeId);
      });
      const renewable = new Set(renewableNodeIds);
      const remaining = map.collectedObjects.filter((nodeId) => !renewable.has(nodeId));
      if (remaining.length === map.collectedObjects.length) continue;
      map.collectedObjects = remaining;
      map.flags = map.flags?.filter((flag) => !renewableNodeIds.some((nodeId) => flag.startsWith(`gathered:${nodeId}:`)));
      changed = true;
    }
    if (changed) this.changed("gathering");
    return changed;
  }
}
