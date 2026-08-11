import type { InventorySystem } from "./InventorySystem.js";
import type { StateChanged } from "./types.js";

export type YodomiTreePhase = 1 | 2 | 3;
export type YodomiAttackKind = "normal" | "piercing" | "enclosure" | "safe_zone";
export type YodomiAttack = { id: "root_spike" | "leaf_blade" | "corrupt_vine" | "root_enclosure" | "corrupt_spores"; name: string; kind: YodomiAttackKind };
export type YodomiTreeStatus = "idle" | "battle" | "purifiable" | "cleansed" | "defeated";

const ATTACKS: Record<YodomiTreePhase, readonly YodomiAttack[]> = {
  1: [{ id: "root_spike", name: "根突き", kind: "normal" }, { id: "leaf_blade", name: "葉刃", kind: "normal" }],
  2: [{ id: "corrupt_vine", name: "穢れ蔦", kind: "piercing" }, { id: "root_enclosure", name: "根の包囲", kind: "enclosure" }],
  3: [{ id: "corrupt_spores", name: "穢れ胞子", kind: "safe_zone" }],
};

export class YodomiTreeBossSystem {
  private statusValue: YodomiTreeStatus = "idle";
  private corruptionValue = 15;
  private wardsValue = 4;
  private attackIndex = 0;
  private attackPhase: YodomiTreePhase = 1;
  private preparedAttack: YodomiAttack | undefined;
  private safeZoneValue = 0;

  constructor(private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get status() { return this.statusValue; }
  get corruption() { return this.corruptionValue; }
  get maxCorruption() { return 15; }
  get wards() { return this.wardsValue; }
  get currentAttack() { return this.preparedAttack; }
  get safeZoneIndex() { return this.safeZoneValue; }
  get phase(): YodomiTreePhase { return this.corruptionValue > 10 ? 1 : this.corruptionValue > 5 ? 2 : 3; }

  start() { this.statusValue = "battle"; this.corruptionValue = 15; this.wardsValue = 4; this.attackIndex = 0; this.attackPhase = 1; this.preparedAttack = undefined; this.safeZoneValue = 0; this.changed("combat"); }
  attack(target: "tree" | "root" = "tree") {
    if (this.statusValue !== "battle") return false;
    if (this.preparedAttack?.kind === "enclosure") {
      if (target !== "root") return false;
      this.preparedAttack = undefined; this.changed("combat"); return true;
    }
    if (this.preparedAttack) return false;
    this.corruptionValue = Math.max(0, this.corruptionValue - 1);
    if (this.corruptionValue === 0) this.statusValue = "purifiable";
    this.changed("combat"); return true;
  }
  prepareNextAttack() {
    if (this.statusValue !== "battle" || this.preparedAttack) return undefined;
    const phase = this.phase;
    if (this.attackPhase !== phase) { this.attackPhase = phase; this.attackIndex = 0; }
    const attacks = ATTACKS[phase];
    const nextAttack = attacks[this.attackIndex % attacks.length];
    if (!nextAttack) return undefined;
    this.preparedAttack = nextAttack; this.attackIndex += 1;
    if (nextAttack.kind === "safe_zone") this.safeZoneValue = (this.safeZoneValue + 1) % 3;
    this.changed("combat"); return this.preparedAttack;
  }
  resolvePreparedAttack(avoided: boolean, barrierActive: boolean, inSafeZone: boolean) {
    if (this.statusValue !== "battle" || !this.preparedAttack) return false;
    const attack = this.preparedAttack;
    if (attack.kind === "enclosure") return false;
    const defended = attack.kind === "normal" ? avoided || barrierActive : attack.kind === "piercing" ? avoided : inSafeZone;
    if (!defended) { this.wardsValue = Math.max(0, this.wardsValue - 1); if (this.wardsValue === 0) this.statusValue = "defeated"; }
    this.preparedAttack = undefined; this.changed("combat"); return true;
  }
  cleanse() {
    if (this.statusValue !== "purifiable") return false;
    this.statusValue = "cleansed"; this.inventory.add("material_purified_wood", 1); this.inventory.add("material_forest_light", 1); this.changed("combat"); return true;
  }
}
