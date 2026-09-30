import type { InventorySystem } from "./InventorySystem.js";
import type { StateChanged } from "./types.js";
import { COOKING_RECIPES } from "./CookingSystem.js";

export type CombatStatus = "idle" | "battle" | "purifiable" | "cleansed" | "defeated";
export type EnemyArchetype = "melee" | "ranged" | "charger" | "area" | "disruptor";
export const ENEMY_ARCHETYPES = {
  melee: { name: "近接型", marker: "近", maxCorruption: 5, moveSpeed: 58, attackRadius: 58, attackCooldownMs: 1_800, telegraphMs: 750, piercing: false, spiritDrain: 0 },
  ranged: { name: "遠距離型", marker: "射", maxCorruption: 5, moveSpeed: 48, attackRadius: 46, attackCooldownMs: 1_300, telegraphMs: 750, piercing: false, spiritDrain: 0 },
  charger: { name: "突進型", marker: "突", maxCorruption: 7, moveSpeed: 96, attackRadius: 72, attackCooldownMs: 2_200, telegraphMs: 900, piercing: false, spiritDrain: 0 },
  area: { name: "範囲型", marker: "範", maxCorruption: 8, moveSpeed: 38, attackRadius: 112, attackCooldownMs: 2_600, telegraphMs: 1_050, piercing: true, spiritDrain: 0 },
  disruptor: { name: "呪い型", marker: "呪", maxCorruption: 6, moveSpeed: 52, attackRadius: 64, attackCooldownMs: 2_000, telegraphMs: 850, piercing: true, spiritDrain: 20 },
} as const;
export type CombatState = { status: CombatStatus; enemyType: EnemyArchetype; wards: number; maxWards: number; corruption: number; maxCorruption: number; attacks: number; spirit: number; maxSpirit: number; barrierActive: boolean; barrierDurability: number };
export type YokaiCardCombatEffect = { spiritCost: number; damage?: number; restoreWards?: number };

export class CombatSystem {
  private encountersStarted = 0;
  private combat: CombatState = { status: "idle", enemyType: "melee", wards: 3, maxWards: 3, corruption: 5, maxCorruption: 5, attacks: 0, spirit: 60, maxSpirit: 100, barrierActive: false, barrierDurability: 3 };
  constructor(private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get state(): Readonly<CombatState> { return this.combat; }
  start(enemyType: EnemyArchetype = "melee") {
    const maxCorruption = ENEMY_ARCHETYPES[enemyType].maxCorruption;
    this.combat = { status: "battle", enemyType, wards: 3, maxWards: 3, corruption: maxCorruption, maxCorruption, attacks: 0, spirit: 60, maxSpirit: 100, barrierActive: false, barrierDurability: 3 };
    this.encountersStarted += 1;
    this.changed("combat");
  }
  suggestedEnemy(chapter: number): EnemyArchetype {
    const candidates: readonly EnemyArchetype[] = chapter <= 1 ? ["melee"] : chapter === 2 ? ["ranged", "area"] : ["charger", "disruptor", "area"];
    return candidates[this.encountersStarted % candidates.length] ?? "melee";
  }
  takeEnemyHit() {
    const profile = ENEMY_ARCHETYPES[this.combat.enemyType];
    const hit = this.takeHit(profile.piercing);
    if (hit && profile.spiritDrain > 0) { this.combat.spirit = Math.max(0, this.combat.spirit - profile.spiritDrain); this.changed("combat"); }
    return hit;
  }
  attack(damage = 1) {
    if (this.combat.status !== "battle") return false;
    this.combat.corruption = Math.max(0, this.combat.corruption - Math.max(1, Math.floor(damage)));
    this.combat.attacks += 1;
    this.combat.spirit = Math.min(this.combat.maxSpirit, this.combat.spirit + 8);
    if (this.combat.corruption === 0) this.combat.status = "purifiable";
    this.changed("combat");
    return true;
  }
  useYokaiCard(effect: YokaiCardCombatEffect) {
    if (this.combat.status !== "battle" || this.combat.spirit < effect.spiritCost) return false;
    this.combat.spirit -= effect.spiritCost;
    if (effect.damage) {
      this.combat.corruption = Math.max(0, this.combat.corruption - Math.max(1, Math.floor(effect.damage)));
      if (this.combat.corruption === 0) this.combat.status = "purifiable";
    }
    if (effect.restoreWards) this.combat.wards = Math.min(this.combat.maxWards, this.combat.wards + effect.restoreWards);
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
    const foodId = Object.values(COOKING_RECIPES).map((recipe) => recipe.resultItemId).find((id) => this.inventory.quantity(id) > 0);
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
