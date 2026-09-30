export type RiceCookingPhase = "mixing" | "plating" | "complete";
export type RiceCookingState = { phase: RiceCookingPhase; strokes: number; lastDirection: -1 | 0 | 1; portions: number; score: number };

export function createRiceCooking(): RiceCookingState {
  return { phase: "mixing", strokes: 0, lastDirection: 0, portions: 0, score: 0 };
}

export function applyRiceMix(state: RiceCookingState, horizontalDistance: number): RiceCookingState {
  if (state.phase !== "mixing" || !Number.isFinite(horizontalDistance) || Math.abs(horizontalDistance) < 45) return state;
  const direction = horizontalDistance > 0 ? 1 : -1;
  const alternated = state.lastDirection === 0 || direction !== state.lastDirection;
  const strokes = state.strokes + 1;
  return { ...state, phase: strokes >= 6 ? "plating" : "mixing", strokes, lastDirection: direction, score: state.score + (alternated ? 0.11 : 0.035) };
}

export function placeRicePortion(state: RiceCookingState, normalizedDistanceFromCenter: number): RiceCookingState {
  if (state.phase !== "plating" || !Number.isFinite(normalizedDistanceFromCenter) || normalizedDistanceFromCenter < 0 || normalizedDistanceFromCenter > 1) return state;
  const portions = state.portions + 1;
  return { ...state, phase: portions >= 3 ? "complete" : "plating", portions, score: state.score + Math.max(0.02, 0.12 * (1 - normalizedDistanceFromCenter)) };
}

export function riceCookingQuality(state: RiceCookingState) {
  return state.score >= 0.88 ? "great" : state.score >= 0.6 ? "success" : "incomplete";
}
