export type ForgeResult = "great" | "success" | "failed";
export type ForgeMiniGameState = { elapsedMs: number; heat: number; targetIndex: number; targets: readonly number[]; durationMs: number; tolerance: number; hits: number; score: number; result: ForgeResult | undefined };
export const FORGE_TARGETS = [0.2, 0.72, 0.42, 0.86, 0.58] as const;
const HARD_TARGETS = [0.16, 0.78, 0.36, 0.9, 0.54, 0.26] as const;

export function createForgeMiniGame(difficulty: "normal" | "hard" = "normal"): ForgeMiniGameState {
  return { elapsedMs: 0, heat: 1, targetIndex: 0, targets: difficulty === "hard" ? HARD_TARGETS : FORGE_TARGETS, durationMs: difficulty === "hard" ? 9_500 : 11_000, tolerance: difficulty === "hard" ? 0.07 : 0.09, hits: 0, score: 0, result: undefined };
}

export function strikeForge(state: ForgeMiniGameState, position: number): ForgeMiniGameState {
  if (state.result || state.targetIndex >= state.targets.length || !Number.isFinite(position) || position < 0 || position > 1) return state;
  const accuracy = Math.abs(Math.max(0, Math.min(1, position)) - (state.targets[state.targetIndex] ?? 0.5));
  const heatBonus = state.heat >= 0.28 && state.heat <= 0.82 ? 1 : 0.55;
  const hitScore = accuracy <= state.tolerance ? 1 * heatBonus : accuracy <= state.tolerance * 2.2 ? 0.55 * heatBonus : 0;
  return { ...state, targetIndex: state.targetIndex + 1, hits: state.hits + (hitScore > 0 ? 1 : 0), score: state.score + hitScore };
}

export function advanceForgeMiniGame(state: ForgeMiniGameState, deltaMs: number): ForgeMiniGameState {
  if (state.result || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const elapsedMs = state.elapsedMs + deltaMs;
  const heat = Math.max(0, 1 - elapsedMs / state.durationMs);
  if (state.targetIndex < state.targets.length && elapsedMs < state.durationMs) return { ...state, elapsedMs, heat };
  const ratio = state.score / state.targets.length;
  const result: ForgeResult = ratio >= 0.9 ? "great" : ratio >= 0.5 ? "success" : "failed";
  return { ...state, elapsedMs, heat, result };
}
