export type BossHudState = { status: string; corruption: number; maxCorruption: number; wards: number };
export function bossHudText(name: string, state: BossHudState): string {
  const wards = Math.max(0, Math.min(4, state.wards));
  if (state.status === "defeated") return `${name}\n護身札が尽きました\n近づいて再挑戦`;
  if (state.status === "purifiable") return `${name}\n穢れを払いきりました\n近づいて浄化`;
  return `${name}  穢れ ${state.corruption}/${state.maxCorruption}\n護身札 ${"◆".repeat(wards)}${"◇".repeat(4 - wards)}`;
}
