import { ENEMY_ARCHETYPES, type CombatState } from "../runtime/systems/CombatSystem.js";
import type { FarmingAction } from "../runtime/systems/FarmingSystem.js";

export const FIELD_TOOL_SPRITE_SHEET = { key: "world-field-tool-actions-v1", path: "/assets/world/field-tool-actions-v1.png", frameWidth: 512, frameHeight: 512 } as const;
export type FieldToolId = "tool_hoe" | "tool_axe" | "tool_pickaxe" | "tool_watering_can" | "tool_hand";
export const fieldToolFrame = (tool: FieldToolId, action?: FarmingAction) => action === "harvest" ? 5 : ({ tool_hoe: 0, tool_axe: 1, tool_pickaxe: 2, tool_watering_can: 3, tool_hand: 4 } as const)[tool];

function gauge(value: number, max: number, cells = 5) {
  const filled = Math.max(0, Math.min(cells, Math.round((value / Math.max(1, max)) * cells)));
  return `${"●".repeat(filled)}${"○".repeat(cells - filled)}`;
}

export function combatHudText(state: Readonly<CombatState>) {
  const instruction = state.status === "purifiable" ? "穢れを削り切った。浄化しよう" : state.status === "battle" ? "攻撃で穢れを削り、敵の攻撃は回避か結界" : "";
  const profile = ENEMY_ARCHETYPES[state.enemyType];
  const counter = profile.piercing ? "紫の予兆は結界を貫通。範囲外へ移動" : "赤い予兆は回避または結界";
  return `${profile.name}  護身札 ${gauge(state.wards, state.maxWards, 3)}\n穢れ ${gauge(state.corruption, state.maxCorruption)}  霊力 ${gauge(state.spirit, state.maxSpirit)}\n${instruction || counter}`;
}

export const farmingActionMessage: Record<Exclude<FarmingAction, "none">, string> = {
  till: "畑を耕しました。次は種を植えられます。",
  plant: "大根の種を植えました。毎日水をあげましょう。",
  water: "水をあげました。眠ると作物が成長します。",
  harvest: "大根を1個収穫しました。",
};
