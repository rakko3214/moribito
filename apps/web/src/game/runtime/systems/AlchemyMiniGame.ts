export type AlchemyInstruction = "slow" | "fast" | "steady" | "reverse";
export type AlchemyQuality = "great" | "success" | "incomplete" | "failed";
export type AlchemyDifficulty = "normal" | "hard" | "expert";
export type AlchemyMiniGameState = {
  elapsedMs: number;
  phase: number;
  instruction: AlchemyInstruction;
  score: number;
  lastAngle: number | undefined;
  lastSpeed: number;
  quality: AlchemyQuality | undefined;
  difficulty: AlchemyDifficulty;
  durationMs: number;
};

const INSTRUCTIONS: readonly AlchemyInstruction[] = ["slow", "fast", "steady", "reverse"];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const angleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function createAlchemyMiniGame(difficulty: AlchemyDifficulty = "normal"): AlchemyMiniGameState {
  return { elapsedMs: 0, phase: 0, instruction: "slow", score: difficulty === "expert" ? 0.36 : difficulty === "hard" ? 0.4 : 0.45, lastAngle: undefined, lastSpeed: 0, quality: undefined, difficulty, durationMs: difficulty === "expert" ? 14_000 : difficulty === "hard" ? 12_000 : 10_000 };
}

export function applyAlchemyRotation(state: AlchemyMiniGameState, angle: number, deltaMs: number): AlchemyMiniGameState {
  if (state.quality || !Number.isFinite(angle) || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  if (state.lastAngle === undefined) return { ...state, lastAngle: angle };
  const delta = angleDelta(state.lastAngle, angle);
  const speed = Math.abs(delta) / (deltaMs / 1000);
  const clockwise = delta > 0;
  const matched = state.instruction === "slow" ? clockwise && speed >= 0.45 && speed <= 1.8
    : state.instruction === "fast" ? clockwise && speed >= 2.4
      : state.instruction === "steady" ? clockwise && Math.abs(speed - Math.max(1.6, state.lastSpeed)) <= 0.85
        : !clockwise && speed >= 0.8;
  // Normalize to elapsed gesture time, not the device's pointer event rate.
  // A delayed event must not award a large amount of unobserved progress.
  const weight = Math.min(deltaMs, 100) / (1000 / 60);
  return { ...state, lastAngle: angle, lastSpeed: speed, score: clamp(state.score + (matched ? 0.035 : -0.022) * weight) };
}

export function releaseAlchemyRotation(state: AlchemyMiniGameState) { return { ...state, lastAngle: undefined }; }

export function advanceAlchemyMiniGame(state: AlchemyMiniGameState, deltaMs: number): AlchemyMiniGameState {
  if (state.quality || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const elapsedMs = state.elapsedMs + deltaMs;
  if (elapsedMs >= state.durationMs) {
    const quality: AlchemyQuality = state.score >= 0.82 ? "great" : state.score >= 0.55 ? "success" : state.score >= 0.28 ? "incomplete" : "failed";
    return { ...state, elapsedMs, quality };
  }
  const phaseLength = state.durationMs / INSTRUCTIONS.length;
  const phase = Math.min(INSTRUCTIONS.length - 1, Math.floor(elapsedMs / phaseLength));
  return { ...state, elapsedMs, phase, instruction: INSTRUCTIONS[phase] ?? "slow" };
}
