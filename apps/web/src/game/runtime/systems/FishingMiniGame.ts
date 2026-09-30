import { FISH_DEFINITIONS, type FishId } from "./FishingSystem.js";

export type FishingMiniGameStatus = "playing" | "caught" | "escaped";
export type FishingMiniGameState = {
  fishId: FishId;
  elapsedMs: number;
  fishPosition: number;
  catcherPosition: number;
  catcherVelocity: number;
  catchProgress: number;
  status: FishingMiniGameStatus;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function createFishingMiniGame(fishId: FishingMiniGameState["fishId"]): FishingMiniGameState {
  return { fishId, elapsedMs: 0, fishPosition: 0.52, catcherPosition: 0.52, catcherVelocity: 0, catchProgress: 0.28, status: "playing" };
}

export function updateFishingMiniGame(state: FishingMiniGameState, held: boolean, deltaMs: number): FishingMiniGameState {
  if (state.status !== "playing" || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  let next = state;
  // Keep the fish, catcher and timeout on the same clock after a slow frame.
  let remaining = Math.min(deltaMs, 250);
  while (remaining > 0.00001 && next.status === "playing") {
    const step = Math.min(remaining, 1000 / 120);
    next = advanceFishingStep(next, held, step);
    remaining -= step;
  }
  return next;
}

function advanceFishingStep(state: FishingMiniGameState, held: boolean, deltaMs: number): FishingMiniGameState {
  const delta = deltaMs / 1000;
  const profile = FISH_DEFINITIONS[state.fishId].struggle;
  const elapsedMs = state.elapsedMs + deltaMs;
  const acceleration = held ? 3.25 : -5.2;
  const catcherVelocity = Math.max(-1.3, Math.min(1.3, state.catcherVelocity + acceleration * delta));
  const catcherPosition = clamp(state.catcherPosition + catcherVelocity * delta);
  const t = elapsedMs / 1000;
  const fishPosition = clamp(0.5 + Math.sin(t * profile.speed) * profile.variation + Math.sin(t * profile.speed * 2.31) * profile.variation * 0.45);
  const inside = Math.abs(fishPosition - catcherPosition) <= 0.145;
  const catchProgress = clamp(state.catchProgress + (inside ? profile.catchRate : -profile.escapeRate) * delta);
  const status: FishingMiniGameStatus = catchProgress >= 1 ? "caught" : catchProgress <= 0 || elapsedMs >= 20_000 ? "escaped" : "playing";
  return { ...state, elapsedMs, fishPosition, catcherPosition, catcherVelocity, catchProgress, status };
}
