import type { CollisionArea } from "./mapTypes.js";
type Point = { x: number; y: number };

/** Visibility graph around expanded rectangles accounts for the actor's body. */
export function combatWaypoint(from: Point, target: Point, width: number, height: number, walls: readonly CollisionArea[], radius = 18): Point | undefined {
  const expanded = walls.map((wall) => ({ x: wall.x - radius, y: wall.y - radius, width: wall.width + radius * 2, height: wall.height + radius * 2 }));
  const allowed = (p: Point) => p.x >= radius && p.x <= width - radius && p.y >= radius && p.y <= height - radius && !expanded.some((w) => p.x >= w.x && p.x <= w.x + w.width && p.y >= w.y && p.y <= w.y + w.height);
  if (!allowed(from) || !allowed(target)) return undefined;
  if (clearAttackPath(from, target, expanded)) return target;
  const corners = expanded.flatMap((w) => [
    { x: w.x - 1, y: w.y - 1 }, { x: w.x + w.width + 1, y: w.y - 1 },
    { x: w.x - 1, y: w.y + w.height + 1 }, { x: w.x + w.width + 1, y: w.y + w.height + 1 },
  ]).filter(allowed);
  const points = [from, target, ...corners];
  const distance = points.map(() => Infinity); distance[0] = 0;
  const previous = points.map(() => -1); const visited = new Set<number>();
  for (let count = 0; count < points.length; count++) {
    let current = -1;
    for (let i = 0; i < points.length; i++) if (!visited.has(i) && (current < 0 || distance[i]! < distance[current]!)) current = i;
    if (current < 0 || !Number.isFinite(distance[current])) return undefined;
    if (current === 1) {
      let next = 1;
      while (previous[next] !== 0) { next = previous[next]!; if (next < 0) return undefined; }
      return points[next];
    }
    visited.add(current);
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i) || !clearAttackPath(points[current]!, points[i]!, expanded)) continue;
      const cost = distance[current]! + Math.hypot(points[i]!.x - points[current]!.x, points[i]!.y - points[current]!.y);
      if (cost < distance[i]!) { distance[i] = cost; previous[i] = current; }
    }
  }
  return undefined;
}

export function clearAttackPath(from: Point, to: Point, walls: readonly CollisionArea[]) {
  return !walls.some((wall) => {
    let near = 0; let far = 1;
    for (const axis of ["x", "y"] as const) {
      const delta = to[axis] - from[axis];
      const low = wall[axis]; const high = low + (axis === "x" ? wall.width : wall.height);
      if (delta === 0) { if (from[axis] < low || from[axis] > high) return false; }
      else {
        const a = (low - from[axis]) / delta; const b = (high - from[axis]) / delta;
        near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
        if (near > far) return false;
      }
    }
    return near <= far;
  });
}

/** Substeps and axis sliding prevent tunnelling through thin obstacles. */
export function moveCombatActor(from: Point, dx: number, dy: number, width: number, height: number, walls: readonly CollisionArea[], radius = 18): Point {
  if (![dx, dy].every(Number.isFinite)) return from;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  let { x, y } = from;
  const blocked = (px: number, py: number) => px < radius || py < radius || px > width - radius || py > height - radius || walls.some((wall) => px + radius > wall.x && px - radius < wall.x + wall.width && py + radius > wall.y && py - radius < wall.y + wall.height);
  for (let i = 0; i < steps; i++) {
    if (!blocked(x + dx / steps, y)) x += dx / steps;
    if (!blocked(x, y + dy / steps)) y += dy / steps;
  }
  return { x, y };
}
