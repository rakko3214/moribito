import type { InventorySystem } from "./InventorySystem.js";
import type { NpcId } from "./NpcInteractionSystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type SideEventDefinition = {
  id: string;
  npcId: NpcId;
  chapter: number;
  title: string;
  description: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reward: number;
  friendship: number;
  completionLine: string;
};

export const SIDE_EVENTS: readonly SideEventDefinition[] = [
  { id: "side_shiki_first_harvest", npcId: "shiki", chapter: 1, title: "最初の収穫", description: "志希と初めて育てた野菜を味わう。", itemId: "item_daikon", itemName: "大根", quantity: 1, reward: 80, friendship: 3, completionLine: "自分で育てた野菜って、特別な味がするね。" },
  { id: "side_kaede_warm_table", npcId: "kaede", chapter: 1, title: "温かな食卓", description: "楓へ手料理を届け、村の食卓を囲む。", itemId: "food_simmered_daikon", itemName: "大根の煮物", quantity: 1, reward: 120, friendship: 3, completionLine: "今度は村のみんなの分も一緒に作りましょう。" },
  { id: "side_genzo_clean_river", npcId: "genzo", chapter: 2, title: "川がくれるもの", description: "川辺で採れた川藻を源三に見せる。", itemId: "item_river_algae", itemName: "川藻", quantity: 1, reward: 130, friendship: 3, completionLine: "川が元気なら、魚も人も元気でいられる。" },
  { id: "side_tessai_old_tool", npcId: "tessai", chapter: 2, title: "道具に宿る時間", description: "鉄斎と古い農具を修理する。", itemId: "item_stone", itemName: "石材", quantity: 2, reward: 150, friendship: 3, completionLine: "道具は直せる。使い手が諦めなければな。" },
  { id: "side_sogen_forest_remedy", npcId: "sogen", chapter: 2, title: "森の薬箱", description: "森きのこの効能を宗玄と調べる。", itemId: "item_mushroom", itemName: "森きのこ", quantity: 1, reward: 160, friendship: 3, completionLine: "森は必要な分だけ、命を分けてくれるのですよ。" },
  { id: "side_yota_guiding_acorn", npcId: "yota", chapter: 3, title: "木の子の贈り物", description: "森で見つけた霊木の実を陽太へ見せる。", itemId: "item_spirit_acorn", itemName: "霊木の実", quantity: 1, reward: 200, friendship: 4, completionLine: "これ、あの木の子が置いてくれたものかもしれない。" },
] as const;

export class SideEventSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  isCompleted(id: string) { return this.state().events.completedEventIds.includes(id); }
  forNpc(npcId: NpcId) {
    return SIDE_EVENTS.filter((event) => event.npcId === npcId && this.state().progression.chapter >= event.chapter && !this.isCompleted(event.id))
      .map((event) => ({ ...event, current: Math.min(this.inventory.quantity(event.itemId), event.quantity), ready: this.inventory.quantity(event.itemId) >= event.quantity }));
  }
  complete(id: string) {
    const event = SIDE_EVENTS.find((candidate) => candidate.id === id);
    if (!event || this.isCompleted(id) || this.state().progression.chapter < event.chapter || this.inventory.quantity(event.itemId) < event.quantity) return undefined;
    if (!this.inventory.remove(event.itemId, event.quantity)) return undefined;
    this.state().events.completedEventIds.push(id);
    this.state().player.money += event.reward;
    const npc = this.state().npcs.states[event.npcId] ?? { friendship: 0, flags: [] };
    this.state().npcs.states[event.npcId] = npc;
    npc.friendship = Math.min(100, (npc.friendship ?? 0) + event.friendship);
    npc.flags ??= [];
    this.changed("events");
    return event;
  }
  get completedCount() { return SIDE_EVENTS.filter((event) => this.isCompleted(event.id)).length; }
  get summary() { return `サブイベント ${this.completedCount}/${SIDE_EVENTS.length}`; }
  get details() {
    const available = SIDE_EVENTS.filter((event) => this.state().progression.chapter >= event.chapter && !this.isCompleted(event.id));
    return available.length ? available.map((event) => `${event.title}: ${event.itemName} ${Math.min(this.inventory.quantity(event.itemId), event.quantity)}/${event.quantity}`).join("\n") : "解放済みのサブイベントは完了しました";
  }
}
