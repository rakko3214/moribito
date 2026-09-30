import type { SaveDataV1 } from "@moribito/shared";
import type { MapId } from "../../world/mapTypes.js";
import type { CombatSystem, YokaiCardCombatEffect } from "./CombatSystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type YokaiCardId = NonNullable<SaveDataV1["yokai"]>["ownedCards"][number]["id"];
export type YokaiCardDefinition = { id: YokaiCardId; name: string; ability: string; spiritCost: number; cooldownMs: number; effect: YokaiCardCombatEffect };

export const YOKAI_CARDS: Record<YokaiCardId, YokaiCardDefinition> = {
  kappa: { id: "kappa", name: "河童", ability: "水流", spiritCost: 30, cooldownMs: 8_000, effect: { spiritCost: 30, damage: 2 } },
  kitsune: { id: "kitsune", name: "妖狐", ability: "狐火", spiritCost: 35, cooldownMs: 10_000, effect: { spiritCost: 35, damage: 3 } },
  zashiki: { id: "zashiki", name: "座敷童子", ability: "福運", spiritCost: 40, cooldownMs: 14_000, effect: { spiritCost: 40, restoreWards: 1 } },
};

const SAFE_EQUIP_MAPS = new Set<MapId>(["map_home", "map_homestead", "map_village", "map_shrine"]);

export class YokaiCardSystem {
  private cooldownRemainingMs = 0;
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly combat: CombatSystem) {}
  get cards() { return this.ensureState().ownedCards; }
  get equippedId() { return this.ensureState().equippedCardId; }
  get equipped() { const id = this.equippedId; return id ? YOKAI_CARDS[id] : null; }
  get cooldownMs() { return Math.ceil(this.cooldownRemainingMs); }
  get isReady() { return this.cooldownRemainingMs <= 0; }

  unlock(id: YokaiCardId) {
    const yokai = this.ensureState();
    if (yokai.ownedCards.some((card) => card.id === id)) return false;
    yokai.ownedCards.push({ id, rank: 1, friendship: 0, upgrade: 0 });
    if (!yokai.equippedCardId) yokai.equippedCardId = id;
    this.changed("yokai");
    return true;
  }

  equip(id: YokaiCardId, mapId: MapId) {
    const yokai = this.ensureState();
    if (!SAFE_EQUIP_MAPS.has(mapId) || this.combat.state.status === "battle" || this.combat.state.status === "purifiable") return false;
    if (!yokai.ownedCards.some((card) => card.id === id) || yokai.equippedCardId === id) return false;
    yokai.equippedCardId = id;
    this.cooldownRemainingMs = 0;
    this.changed("yokai");
    return true;
  }

  activate() {
    const card = this.equipped;
    if (!card || !this.isReady || !this.combat.useYokaiCard(card.effect)) return false;
    this.cooldownRemainingMs = card.cooldownMs;
    this.changed("yokai");
    return true;
  }

  update(deltaMs: number) {
    if (this.cooldownRemainingMs <= 0) return;
    const before = Math.ceil(this.cooldownRemainingMs / 1000);
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);
    if (Math.ceil(this.cooldownRemainingMs / 1000) !== before) this.changed("yokai");
  }

  private ensureState() {
    return this.state().yokai ??= { ownedCards: [], equippedCardId: null };
  }
}
