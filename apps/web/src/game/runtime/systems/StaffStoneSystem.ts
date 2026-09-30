import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const STAFF_STONES = {
  stone_power: { name: "剛力石", color: 0xc95f54, damage: 2, range: 0.8, projectile: "large", description: "大きく重い一撃。威力は高いが射程は短い。" },
  stone_range: { name: "遠射石", color: 0x5d91c4, damage: 1, range: 2, projectile: "long", description: "青い攻撃を遠くまで飛ばす。" },
  stone_homing: { name: "追尾石", color: 0x69a66b, damage: 1, range: 1.45, projectile: "homing", description: "緑の攻撃が穢れを追いかける。" },
  stone_spread: { name: "拡散石", color: 0xd6ad4d, damage: 1, range: 1.1, projectile: "spread", description: "黄色い攻撃を前方3方向へ放つ。" },
  stone_piercing: { name: "貫通石", color: 0xe8e3cf, damage: 1, range: 1.55, projectile: "piercing", description: "白い攻撃が複数の穢れを貫く。" },
  stone_rapid: { name: "連射石", color: 0x8c67b4, damage: 1, range: 1.25, projectile: "rapid", description: "紫の小さな攻撃を素早く連射する。" },
} as const;
export type StaffStoneId = keyof typeof STAFF_STONES;

export class StaffStoneSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get equippedId() { const id = this.state().player.equippedItemId; return id && id in STAFF_STONES ? id as StaffStoneId : undefined; }
  get equipped() { return this.equippedId ? STAFF_STONES[this.equippedId] : undefined; }
  owns(id: StaffStoneId) { return this.inventory.quantity(id) > 0; }
  canCraft(id: StaffStoneId) { return !this.owns(id) && this.inventory.quantity("item_stone") >= 2; }
  craft(id: StaffStoneId) {
    if (!this.canCraft(id) || !this.inventory.remove("item_stone", 2)) return false;
    this.inventory.add(id, 1); this.changed("progression"); return true;
  }
  equip(id: StaffStoneId, canChange: boolean) {
    if (!canChange || !this.owns(id)) return false;
    this.state().player.equippedItemId = id; this.changed("progression"); return true;
  }
}
