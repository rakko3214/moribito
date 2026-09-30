import type { LivestockSystem } from "./LivestockSystem.js";
import type { PlacementSystem, PlacedObject } from "./PlacementSystem.js";

export type PlacedInteraction = "sleep" | "workbench" | "storage" | "sit" | "inspect" | "feed" | "water" | "edit_sign" | "toggle_gate" | "manage_building";

const INTERACTIONS: Record<string, { action: PlacedInteraction; label: string }> = {
  furniture_bed: { action: "sleep", label: "眠る" },
  furniture_workbench: { action: "workbench", label: "作業台を使う" },
  furniture_storage_box: { action: "storage", label: "収納箱を使う" },
  furniture_wooden_chair: { action: "sit", label: "椅子に座る" },
  furniture_wooden_table: { action: "inspect", label: "机を調べる" },
  placeable_feed_trough: { action: "feed", label: "餌箱から餌を与える" },
  placeable_water_trough: { action: "water", label: "水飲み場を確認" },
  placeable_wooden_sign: { action: "edit_sign", label: "看板を書く" },
  placeable_fence_gate: { action: "toggle_gate", label: "柵の扉を開閉" },
  building_chicken_coop: { action: "manage_building", label: "鶏小屋を確認" },
  building_livestock_barn: { action: "manage_building", label: "家畜小屋を確認" },
};

export class PlacedObjectInteractionSystem {
  constructor(private readonly placement: PlacementSystem, private readonly livestock: LivestockSystem) {}
  describe(placed: PlacedObject) { return INTERACTIONS[placed.itemId]; }
  interact(mapId: string, placed: PlacedObject, signLabel?: string) {
    const definition = this.describe(placed); if (!definition) return { action: "inspect" as const, message: "配置物を確認しました。" };
    if (definition.action === "feed") { const count = this.livestock.feedAll(); return { action: definition.action, message: count > 0 ? `${count}匹へ餌を与えました。` : "餌を必要としている家畜がいません。" }; }
    if (definition.action === "water") return { action: definition.action, message: this.livestock.animals.length > 0 ? "水飲み場にはきれいな水が入っています。" : "まだ家畜はいません。" };
    if (definition.action === "toggle_gate") { const active = !(placed.active ?? false); this.placement.updateState(mapId, placed.id, { active }); return { action: definition.action, message: active ? "柵の扉を開けました。" : "柵の扉を閉めました。" }; }
    if (definition.action === "edit_sign" && signLabel !== undefined) { this.placement.updateState(mapId, placed.id, { label: signLabel }); return { action: definition.action, message: `看板を「${signLabel.trim().slice(0, 30)}」に書き換えました。` }; }
    if (definition.action === "sit") return { action: definition.action, message: "椅子に腰掛け、少し休みました。" };
    if (definition.action === "inspect") return { action: definition.action, message: "木の机です。料理や道具を飾れそうです。" };
    return { action: definition.action, message: "小屋の家畜管理を開きます。" };
  }
}
