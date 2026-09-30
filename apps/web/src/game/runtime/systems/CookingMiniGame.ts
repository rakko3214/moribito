export type CookingQuality = "great" | "success" | "incomplete" | "failed";
export type CookingMiniGameState = {
  elapsedMs: number;
  heat: number;
  targetHeat: number;
  qualityScore: number;
  burn: number;
  result: CookingQuality | undefined;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function createCookingMiniGame(initialQuality = 0.42): CookingMiniGameState {
  return { elapsedMs: 0, heat: 0.42, targetHeat: 0.48, qualityScore: clamp(initialQuality), burn: 0, result: undefined };
}

export function setCookingHeat(state: CookingMiniGameState, heat: number): CookingMiniGameState {
  return state.result ? state : { ...state, heat: clamp(heat) };
}

export function advanceCookingMiniGame(state: CookingMiniGameState, deltaMs: number): CookingMiniGameState {
  if (state.result) return state;
  const delta = Math.min(deltaMs, 100) / 1000;
  const elapsedMs = state.elapsedMs + deltaMs;
  const t = elapsedMs / 1000;
  const targetHeat = clamp(0.5 + Math.sin(t * 1.15) * 0.2 + (t > 7 ? -0.12 : 0));
  const distance = Math.abs(state.heat - targetHeat);
  const qualityScore = clamp(state.qualityScore + (distance <= 0.13 ? 0.075 : distance <= 0.23 ? 0.01 : -0.065) * delta);
  const burn = clamp(state.burn + (state.heat >= 0.84 ? 0.22 : -0.08) * delta);
  if (elapsedMs < 12_000) return { ...state, elapsedMs, targetHeat, qualityScore, burn };
  const result: CookingQuality = burn >= 0.72 ? "failed" : qualityScore >= 0.78 ? "great" : qualityScore >= 0.52 ? "success" : qualityScore >= 0.28 ? "incomplete" : "failed";
  return { ...state, elapsedMs, targetHeat, qualityScore, burn, result };
}

export function cookingAdvice(state: CookingMiniGameState) {
  if (state.heat >= 0.84) return "火が強すぎるよ！ 下へ滑らせて弱めて！";
  if (state.heat < state.targetHeat - 0.13) return "もう少し強火。上へ滑らせてみて。";
  if (state.heat > state.targetHeat + 0.13) return "少し火を弱めよう。下へ滑らせて。";
  return "その火加減で大丈夫。色の範囲を保ってね。";
}
