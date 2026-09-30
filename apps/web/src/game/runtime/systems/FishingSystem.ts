import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const FISH_DEFINITIONS = {
  fish_ayu: { name: "鮎", approach: { approachMs: 760, nibbleMs: 520, nibbles: 3, biteMs: 680, castAccuracy: 0.64 }, struggle: { speed: 2.25, variation: 0.29, catchRate: 0.25, escapeRate: 0.17 } },
  fish_crucian_carp: { name: "フナ", approach: { approachMs: 1_050, nibbleMs: 720, nibbles: 2, biteMs: 1_000, castAccuracy: 0.55 }, struggle: { speed: 1.3, variation: 0.16, catchRate: 0.34, escapeRate: 0.12 } },
  fish_yamame: { name: "ヤマメ", approach: { approachMs: 650, nibbleMs: 420, nibbles: 2, biteMs: 560, castAccuracy: 0.67 }, struggle: { speed: 2.65, variation: 0.3, catchRate: 0.23, escapeRate: 0.19 } },
  fish_koi: { name: "鯉", approach: { approachMs: 1_250, nibbleMs: 820, nibbles: 3, biteMs: 900, castAccuracy: 0.53 }, struggle: { speed: 1.05, variation: 0.22, catchRate: 0.28, escapeRate: 0.13 } },
  fish_catfish: { name: "なまず", approach: { approachMs: 1_100, nibbleMs: 650, nibbles: 1, biteMs: 720, castAccuracy: 0.58 }, struggle: { speed: 1.65, variation: 0.27, catchRate: 0.22, escapeRate: 0.18 } },
  fish_eel: { name: "うなぎ", approach: { approachMs: 900, nibbleMs: 460, nibbles: 4, biteMs: 520, castAccuracy: 0.7 }, struggle: { speed: 2.9, variation: 0.34, catchRate: 0.19, escapeRate: 0.22 } },
} as const;
export type FishId = keyof typeof FISH_DEFINITIONS;
const CATCHES: readonly FishId[] = ["fish_ayu", "fish_crucian_carp", "fish_ayu", "fish_yamame", "fish_koi", "fish_catfish", "fish_eel"];
const COUNT_PREFIX = "fishing_cast_count:";

export class FishingSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get nextCatch() {
    const current = this.state().events.flags.find((flag) => flag.startsWith(COUNT_PREFIX));
    const count = current ? Number(current.slice(COUNT_PREFIX.length)) || 0 : 0;
    return CATCHES[count % CATCHES.length] ?? "fish_ayu";
  }
  cast() {
    const fishId = this.nextCatch;
    const flags = this.state().events.flags;
    const current = flags.find((flag) => flag.startsWith(COUNT_PREFIX));
    const count = current ? Number(current.slice(COUNT_PREFIX.length)) || 0 : 0;
    if (current) flags.splice(flags.indexOf(current), 1);
    flags.push(`${COUNT_PREFIX}${count + 1}`);
    this.inventory.add(fishId, 1);
    this.changed("fishing");
    return fishId;
  }
}
