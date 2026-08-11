import type { InventorySystem } from "./InventorySystem.js";
import type { NpcId } from "./NpcInteractionSystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

const REQUESTS = [
  { id: "request_kaede_daikon", npcId: "kaede", itemId: "item_daikon", quantity: 2, reward: 120, title: "楓へ大根を届ける" },
  { id: "request_tessai_wood", npcId: "tessai", itemId: "item_wood", quantity: 2, reward: 100, title: "鉄斎へ木材を届ける" },
] as const;

export class VillagerRequestSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}

  ensureStarted() {
    let added = false;
    for (const request of REQUESTS) {
      if (this.state().quests.completedIds.includes(request.id) || this.state().quests.active.some((quest) => quest.id === request.id)) continue;
      this.state().quests.active.push({ id: request.id, step: "deliver", value: 0 });
      added = true;
    }
    if (added) this.changed("quests");
    return added;
  }

  deliverTo(npcId: NpcId) {
    const request = REQUESTS.find((candidate) => candidate.npcId === npcId && this.state().quests.active.some((quest) => quest.id === candidate.id));
    if (!request || this.inventory.quantity(request.itemId) < request.quantity) return undefined;
    this.inventory.remove(request.itemId, request.quantity);
    const index = this.state().quests.active.findIndex((quest) => quest.id === request.id);
    this.state().quests.active.splice(index, 1);
    this.state().quests.completedIds.push(request.id);
    this.state().player.money += request.reward;
    this.changed("quests");
    return { title: request.title, reward: request.reward };
  }

  get summary() {
    const request = REQUESTS.find((candidate) => this.state().quests.active.some((quest) => quest.id === candidate.id));
    if (!request) return "村人依頼は完了しました";
    return `${request.title} ${Math.min(this.inventory.quantity(request.itemId), request.quantity)}/${request.quantity}`;
  }
}
