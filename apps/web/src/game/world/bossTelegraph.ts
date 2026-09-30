export const BOSS_ATTACK_RADIUS = 115;
export const TREE_SAFE_RADIUS = 64;
export const TREE_SAFE_ZONES = [{ x: 480, y: 500 }, { x: 650, y: 590 }, { x: 830, y: 500 }];

export function insideBossCircle(point: { x: number; y: number }, center: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(point.x - center.x, point.y - center.y) <= radius;
}

export function frogDefense(kind: "normal" | "piercing" | "ultimate", avoided: boolean, barrier: boolean): "barrier" | "evaded" | "hit" {
  if (barrier && kind !== "piercing") return "barrier";
  if (avoided && kind !== "ultimate") return "evaded";
  return "hit";
}
