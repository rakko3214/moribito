export type CollisionFootprint = { x: number; y: number; width: number; height: number };

/** NPCの座標は足元を表すため、胴体ではなく足元側だけを塞ぐ。 */
export function npcCollisionFootprint(x: number, y: number): CollisionFootprint {
  return { x: x - 13, y: y - 18, width: 26, height: 18 };
}

/** 木は幹、岩は接地部分だけを塞ぎ、手採取素材は通過可能にする。 */
export function gatheringCollisionFootprint(x: number, y: number, requiredTool?: string): CollisionFootprint | undefined {
  if (requiredTool === "tool_axe") return { x: x - 19, y: y - 25, width: 38, height: 25 };
  if (requiredTool === "tool_pickaxe") return { x: x - 16, y: y - 22, width: 32, height: 22 };
  return undefined;
}
