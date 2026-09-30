import { FISH_DEFINITIONS, type FishId } from "./FishingSystem.js";

export type FishingApproachPhase = "casting" | "approaching" | "nibbling" | "bite" | "hooked" | "escaped";
export type FishingApproachFishId = FishId;
export type FishingApproachState = { phase: FishingApproachPhase; fishId: FishingApproachFishId; elapsedMs: number; nibbleCount: number; landingAccuracy: number };

export function createFishingApproach(fishId: FishingApproachFishId = "fish_ayu"): FishingApproachState {
  return { phase: "casting", fishId, elapsedMs: 0, nibbleCount: 0, landingAccuracy: 0 };
}

export function castTowardFish(state: FishingApproachState, swipeX: number, swipeY: number) {
  if (state.phase !== "casting") return state;
  const length = Math.hypot(swipeX, swipeY);
  if (length < 35) return { ...state, phase: "escaped" as const };
  const normalizedX = swipeX / length; const normalizedY = swipeY / length;
  const targetX = 0.55; const targetY = -0.84;
  const landingAccuracy = Math.max(0, 1 - Math.hypot(normalizedX - targetX, normalizedY - targetY));
  return { ...state, phase: landingAccuracy >= FISH_DEFINITIONS[state.fishId].approach.castAccuracy ? "approaching" as const : "escaped" as const, elapsedMs: 0, landingAccuracy };
}

export function advanceFishingApproach(state: FishingApproachState, deltaMs: number): FishingApproachState {
  if (["casting", "hooked", "escaped"].includes(state.phase)) return state;
  const profile = FISH_DEFINITIONS[state.fishId].approach;
  const elapsedMs = state.elapsedMs + deltaMs;
  if (state.phase === "approaching" && elapsedMs >= profile.approachMs) return { ...state, phase: "nibbling", elapsedMs: 0 };
  if (state.phase === "nibbling" && elapsedMs >= profile.nibbleMs) {
    const nibbleCount = state.nibbleCount + 1;
    return { ...state, phase: nibbleCount >= profile.nibbles ? "bite" : "nibbling", nibbleCount, elapsedMs: 0 };
  }
  if (state.phase === "bite" && elapsedMs >= profile.biteMs) return { ...state, phase: "escaped", elapsedMs };
  return { ...state, elapsedMs };
}

export function hookFishingApproach(state: FishingApproachState) {
  if (state.phase === "bite") return { ...state, phase: "hooked" as const };
  if (state.phase === "nibbling" || state.phase === "approaching") return { ...state, phase: "escaped" as const };
  return state;
}
