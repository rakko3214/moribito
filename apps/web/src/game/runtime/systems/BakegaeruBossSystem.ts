import type { InventorySystem } from "./InventorySystem.js";
import type { StateChanged } from "./types.js";

export type BakegaeruPhase = 1 | 2 | 3;
export type BakegaeruAttackKind = "normal" | "piercing" | "ultimate";
export type BakegaeruAttack = {
  id: "tongue_thrust" | "leap" | "water_shots" | "corruption_pool" | "cursed_sweep" | "rotating_shots" | "muddy_tidal_wave";
  name: string;
  kind: BakegaeruAttackKind;
};
export type BakegaeruStatus = "idle" | "battle" | "purifiable" | "cleansed" | "defeated";

const ATTACKS: Record<BakegaeruPhase, readonly BakegaeruAttack[]> = {
  1: [
    { id: "tongue_thrust", name: "舌突き", kind: "normal" },
    { id: "leap", name: "飛び掛かり", kind: "normal" },
    { id: "water_shots", name: "3方向水弾", kind: "normal" },
  ],
  2: [
    { id: "corruption_pool", name: "穢れ沼", kind: "piercing" },
    { id: "cursed_sweep", name: "呪いの舌薙ぎ", kind: "piercing" },
    { id: "rotating_shots", name: "回転水弾", kind: "normal" },
  ],
  3: [{ id: "muddy_tidal_wave", name: "濁流大波", kind: "ultimate" }],
};

export class BakegaeruBossSystem {
  private statusValue: BakegaeruStatus = "idle";
  private corruptionValue = 12;
  private wardsValue = 4;
  private attackIndex = 0;
  private preparedAttack: BakegaeruAttack | undefined;
  private fatiguedValue = false;

  constructor(private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}

  get status() { return this.statusValue; }
  get corruption() { return this.corruptionValue; }
  get maxCorruption() { return 12; }
  get wards() { return this.wardsValue; }
  get fatigued() { return this.fatiguedValue; }
  get currentAttack() { return this.preparedAttack; }
  get phase(): BakegaeruPhase { return this.corruptionValue > 8 ? 1 : this.corruptionValue > 4 ? 2 : 3; }

  start() {
    this.statusValue = "battle";
    this.corruptionValue = 12;
    this.wardsValue = 4;
    this.attackIndex = 0;
    this.preparedAttack = undefined;
    this.fatiguedValue = false;
    this.changed("combat");
  }

  attack() {
    if (this.statusValue !== "battle") return false;
    const damage = this.phase === 3 && this.fatiguedValue ? 2 : 1;
    this.corruptionValue = Math.max(0, this.corruptionValue - damage);
    this.fatiguedValue = false;
    if (this.corruptionValue === 0) this.statusValue = "purifiable";
    this.changed("combat");
    return true;
  }

  prepareNextAttack() {
    if (this.statusValue !== "battle") return undefined;
    const attacks = ATTACKS[this.phase];
    this.preparedAttack = attacks[this.attackIndex % attacks.length];
    this.attackIndex += 1;
    this.changed("combat");
    return this.preparedAttack;
  }

  resolvePreparedAttack(avoided: boolean, barrierActive: boolean) {
    if (this.statusValue !== "battle" || !this.preparedAttack) return false;
    const attack = this.preparedAttack;
    const blocked = attack.kind === "ultimate" ? barrierActive : attack.kind === "normal" && barrierActive;
    const escaped = attack.kind !== "ultimate" && avoided;
    if (!blocked && !escaped) {
      this.wardsValue = Math.max(0, this.wardsValue - 1);
      if (this.wardsValue === 0) this.statusValue = "defeated";
    }
    this.fatiguedValue = attack.kind === "ultimate";
    this.preparedAttack = undefined;
    this.changed("combat");
    return true;
  }

  cleanse() {
    if (this.statusValue !== "purifiable") return false;
    this.statusValue = "cleansed";
    this.inventory.add("material_purified_water", 1);
    this.inventory.add("material_yuishi_fragment", 1);
    this.changed("combat");
    return true;
  }
}
