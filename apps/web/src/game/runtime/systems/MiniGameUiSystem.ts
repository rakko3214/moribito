export type MiniGameExitDecision = { action: "close" | "arm"; armedUntil: number };

export function decideMiniGameExit(active: boolean, armedUntil: number, now: number): MiniGameExitDecision {
  if (!active || (armedUntil > 0 && now <= armedUntil)) return { action: "close", armedUntil: 0 };
  return { action: "arm", armedUntil: now + 1_500 };
}
