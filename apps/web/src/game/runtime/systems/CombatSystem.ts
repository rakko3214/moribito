import type { InventorySystem } from "./InventorySystem.js";
import type { StateChanged } from "./types.js";

export type CombatStatus = "idle" | "battle" | "purifiable" | "cleansed" | "defeated";
export type EnemyArchetype = "melee" | "ranged" | "charger";
export type CombatState = { status: CombatStatus; enemyType: EnemyArchetype; wards: number; maxWards: number; corruption: number; maxCorruption: number; attacks: number; spirit: number; maxSpirit: number; barrierActive: boolean; barrierDurability: number };

export class CombatSystem {
  private combat: CombatState = { status: "idle", enemyType: "melee", wards: 3, maxWards: 3, corruption: 5, maxCorruption: 5, attacks: 0, spirit: 60, maxSpirit: 100, barrierActive: false, barrierDurability: 3 };
  constructor(private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get state(): Readonly<CombatState> { return this.combat; }
  start(enemyType: EnemyArchetype = "melee") {
    this.combat = { status: "battle", enemyType, wards: 3, maxWards: 3, corruption: 5, maxCorruption: 5, attacks: 0, spirit: 60, maxSpirit: 100, barrierActive: false, barrierDurability: 3 };
    this.changed("combat");
  }
  attack() {
    if (this.combat.status !== "battle") return false;
    this.combat.corruption = Math.max(0, this.combat.corruption - 1);
    this.combat.attacks += 1;
    this.combat.spirit = Math.min(this.combat.maxSpirit, this.combat.spirit + 8);
    if (this.combat.corruption === 0) this.combat.status = "purifiable";
    this.changed("combat");
    return true;
  }
  takeHit(piercing = false) {
    if (this.combat.status !== "battle") return false;
    if (this.combat.barrierActive && !piercing && this.combat.barrierDurability > 0) {
      this.combat.barrierDurability -= 1;
      if (this.combat.barrierDurability === 0) this.combat.barrierActive = false;
      this.changed("combat");
      return true;
    }
    this.combat.wards = Math.max(0, this.combat.wards - 1);
    if (this.combat.wards === 0) this.combat.status = "defeated";
    this.changed("combat");
    return true;
  }
  setBarrier(active: boolean) {
    this.combat.barrierActive = active && this.combat.status === "battle" && this.combat.spirit >= 10 && this.combat.barrierDurability > 0;
    this.changed("combat");
    return this.combat.barrierActive;
  }
  update(deltaMs: number) {
    if (this.combat.status !== "battle") return;
    const deltaSeconds = deltaMs / 1000;
    const before = this.combat.spirit;
    if (this.combat.barrierActive) {
      this.combat.spirit = Math.max(0, this.combat.spirit - 25 * deltaSeconds);
      if (this.combat.spirit === 0) this.combat.barrierActive = false;
    } else this.combat.spirit = Math.min(this.combat.maxSpirit, this.combat.spirit + 4 * deltaSeconds);
    if (Math.floor(before) !== Math.floor(this.combat.spirit)) this.changed("combat");
  }
  useFood() {
    if (this.combat.status !== "battle" || this.combat.wards >= this.combat.maxWards) return false;
    const foodId = ["food_simmered_daikon", "food_herb_rice"].find((id) => this.inventory.quantity(id) > 0);
    if (!foodId || !this.inventory.remove(foodId, 1)) return false;
    this.combat.wards = Math.min(this.combat.maxWards, this.combat.wards + 1);
    this.changed("combat");
    return true;
  }
  cleanse() {
    if (this.combat.status !== "purifiable") return false;
    this.combat.status = "cleansed";
    this.inventory.add("material_purified_fragment", 1);
    this.changed("combat");
    return true;
  }
}
