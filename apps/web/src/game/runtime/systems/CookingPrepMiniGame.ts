export type CookingPrepState = {
  cuts: number[];
  score: number;
  complete: boolean;
};

const CUT_TARGETS = [0.25, 0.5, 0.75] as const;

export function createCookingPrep(): CookingPrepState {
  return { cuts: [], score: 0, complete: false };
}

export function applyCookingCut(state: CookingPrepState, normalizedX: number, swipeDistance: number): CookingPrepState {
  if (state.complete || Math.abs(swipeDistance) < 45 || normalizedX < 0 || normalizedX > 1) return state;
  const remaining = CUT_TARGETS.map((target, index) => ({ target, index })).filter(({ index }) => !state.cuts.includes(index));
  const nearest = remaining.sort((a, b) => Math.abs(a.target - normalizedX) - Math.abs(b.target - normalizedX))[0];
  if (!nearest || Math.abs(nearest.target - normalizedX) > 0.14) return state;
  const accuracy = Math.max(0, 1 - Math.abs(nearest.target - normalizedX) / 0.14);
  const cuts = [...state.cuts, nearest.index];
  return { cuts, score: state.score + accuracy / CUT_TARGETS.length, complete: cuts.length === CUT_TARGETS.length };
}

export function prepQuality(state: CookingPrepState) {
  return state.score >= 0.82 ? "great" : state.score >= 0.55 ? "success" : "incomplete";
}
