import type { InventorySystem } from "./InventorySystem.js";
import type { NpcId } from "./NpcInteractionSystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const VILLAGER_REQUESTS = [
  { id: "request_kaede_daikon", npcId: "kaede", itemId: "item_daikon", quantity: 2, reward: 120, title: "楓へ大根を届ける" },
  { id: "request_tessai_wood", npcId: "tessai", itemId: "item_wood", quantity: 2, reward: 100, title: "鉄斎へ木材を届ける" },
  { id: "request_shiki_carrot", npcId: "shiki", itemId: "item_carrot", quantity: 2, reward: 140, title: "志希へ人参を届ける" },
  { id: "request_genzo_crucian", npcId: "genzo", itemId: "fish_crucian_carp", quantity: 2, reward: 160, title: "源三へフナを届ける" },
  { id: "request_sogen_yomogi", npcId: "sogen", itemId: "item_yomogi", quantity: 3, reward: 150, title: "宗玄へよもぎを届ける" },
  { id: "request_kaede_pickles", npcId: "kaede", itemId: "food_cucumber_pickles", quantity: 1, reward: 190, title: "楓へ浅漬けを届ける" },
  { id: "request_tessai_stone", npcId: "tessai", itemId: "item_stone", quantity: 4, reward: 180, title: "鉄斎へ石材を届ける" },
  { id: "request_soichiro_pumpkin", npcId: "soichiro", itemId: "item_pumpkin", quantity: 2, reward: 240, title: "宗一郎へかぼちゃを届ける" },
  { id: "request_genzo_yamame", npcId: "genzo", itemId: "fish_yamame", quantity: 1, reward: 220, title: "源三へヤマメを届ける" },
  { id: "request_sogen_antidote", npcId: "sogen", itemId: "medicine_antidote", quantity: 1, reward: 260, title: "宗玄へ解毒薬を届ける" },
] as const;

export class VillagerRequestSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}

  ensureStarted() {
    let added = false;
    for (const request of VILLAGER_REQUESTS) {
      if (this.state().quests.completedIds.includes(request.id) || this.state().quests.active.some((quest) => quest.id === request.id)) continue;
      this.state().quests.active.push({ id: request.id, step: "deliver", value: 0 });
      added = true;
    }
    if (added) this.changed("quests");
    return added;
  }

  deliverTo(npcId: NpcId) {
    const active = (request: (typeof VILLAGER_REQUESTS)[number]) => this.state().quests.active.some((quest) => quest.id === request.id);
    const request = VILLAGER_REQUESTS.find((candidate) => candidate.npcId === npcId && active(candidate) && this.inventory.quantity(candidate.itemId) >= candidate.quantity);
    if (!request) return undefined;
    this.inventory.remove(request.itemId, request.quantity);
    const index = this.state().quests.active.findIndex((quest) => quest.id === request.id);
    this.state().quests.active.splice(index, 1);
    this.state().quests.completedIds.push(request.id);
    this.state().player.money += request.reward;
    this.changed("quests");
    return { title: request.title, reward: request.reward };
  }

  get summary() {
    const activeRequests = VILLAGER_REQUESTS.filter((candidate) => this.state().quests.active.some((quest) => quest.id === candidate.id));
    const request = activeRequests[0];
    if (!request) return "村人依頼は完了しました";
    return `残り${activeRequests.length}件 / ${request.title} ${Math.min(this.inventory.quantity(request.itemId), request.quantity)}/${request.quantity}`;
  }
  get details() {
    const activeRequests = VILLAGER_REQUESTS.filter((candidate) => this.state().quests.active.some((quest) => quest.id === candidate.id));
    if (activeRequests.length === 0) return "村人依頼は完了しました";
    return activeRequests.map((request) => `${request.title} ${Math.min(this.inventory.quantity(request.itemId), request.quantity)}/${request.quantity}`).join("\n");
  }
  get activeRequests() {
    return VILLAGER_REQUESTS.filter((request) => this.state().quests.active.some((quest) => quest.id === request.id)).map((request) => ({ ...request, current: Math.min(this.inventory.quantity(request.itemId), request.quantity) }));
  }
}
