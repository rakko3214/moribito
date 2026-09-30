import { describe, expect, it } from "vitest";
import { clearAttackPath, combatWaypoint, moveCombatActor } from "./combatGeometry.js";
describe("combat obstacles", () => {
  it("routes around a wall without crossing it", () => {
    const obstacles = [{ x: 140, y: 80, width: 40, height: 160 }];
    let actor = { x: 80, y: 150 }; const goal = { x: 250, y: 150 };
    for (let i = 0; i < 250 && Math.hypot(actor.x - goal.x, actor.y - goal.y) > 2; i++) {
      const next = combatWaypoint(actor, goal, 400, 400, obstacles);
      expect(next).toBeDefined();
      const dx = next!.x - actor.x; const dy = next!.y - actor.y;
      const scale = Math.min(1, 3 / Math.hypot(dx, dy));
      actor = moveCombatActor(actor, dx * scale, dy * scale, 400, 400, obstacles);
      expect(actor.x + 18 <= 140 || actor.x - 18 >= 180 || actor.y + 18 <= 80 || actor.y - 18 >= 240).toBe(true);
    }
    expect(Math.hypot(actor.x - goal.x, actor.y - goal.y)).toBeLessThan(3);
  });
  it("does not attempt an unreachable target", () => {
    expect(combatWaypoint({ x: 50, y: 150 }, { x: 250, y: 150 }, 400, 400, [{ x: 140, y: 0, width: 40, height: 400 }])).toBeUndefined();
  });
  const walls = [{ x: 100, y: 20, width: 2, height: 180 }];
  it("blocks thin walls in both attack directions", () => {
    expect(clearAttackPath({ x: 50, y: 100 }, { x: 150, y: 100 }, walls)).toBe(false);
    expect(clearAttackPath({ x: 150, y: 100 }, { x: 50, y: 100 }, walls)).toBe(false);
    expect(clearAttackPath({ x: 50, y: 230 }, { x: 150, y: 230 }, walls)).toBe(true);
  });
  it("cannot tunnel through an obstacle on a long frame", () => {
    const moved = moveCombatActor({ x: 50, y: 100 }, 180, 0, 400, 400, walls);
    expect(moved.x).toBeLessThanOrEqual(82);
  });
  it("slides along obstacles and respects the map edge", () => {
    const moved = moveCombatActor({ x: 80, y: 70 }, 30, 30, 400, 400, walls);
    expect(moved.x).toBeLessThanOrEqual(82); expect(moved.y).toBeCloseTo(100);
    expect(moveCombatActor({ x: 20, y: 20 }, -100, -100, 400, 400, []).x).toBeGreaterThanOrEqual(18);
  });
});
