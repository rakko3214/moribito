import type { NpcId } from "../runtime/systems/NpcInteractionSystem.js";
import type { LifeMenuOption } from "./lifeUiPresentation.js";

export type NpcFacilityAction = "cooking" | "alchemy" | "smithing" | "fishing";
export type NpcFacilityOption = LifeMenuOption & { action: NpcFacilityAction };

const FACILITY_OPTIONS: Partial<Record<NpcId, NpcFacilityOption>> = {
  kaede: { id: "facility:cooking", action: "cooking", label: "料理を教わる", enabled: true, detail: "レシピを選び、調理を始める" },
  sogen: { id: "facility:alchemy", action: "alchemy", label: "調合を教わる", enabled: true, detail: "薬を選び、調合を始める" },
  tessai: { id: "facility:smithing", action: "smithing", label: "鍛冶を頼む", enabled: true, detail: "結晶石の制作と装着" },
  genzo: { id: "facility:fishing", action: "fishing", label: "釣りを教わる", enabled: true, detail: "魚影の見方から教わる" },
};

export const npcFacilityOption = (npcId: NpcId) => FACILITY_OPTIONS[npcId];
export const npcFacilityAction = (optionId: string) => Object.values(FACILITY_OPTIONS).find((option) => option?.id === optionId)?.action;
