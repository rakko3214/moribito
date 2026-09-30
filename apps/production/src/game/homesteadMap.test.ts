import { describe, expect, it } from "vitest";
import { canStandAt, HOMESTEAD } from "./homesteadMap.js";

describe("production homestead map", () => {
  it("uses the Tiled spawn and collision layer", () => {
    expect([HOMESTEAD.width, HOMESTEAD.height]).toEqual([800, 640]);
    expect(HOMESTEAD.start).toEqual({ x: 400, y: 360 });
    expect(canStandAt(400, 360)).toBe(true);
    expect(canStandAt(400, 100)).toBe(false);
    expect(canStandAt(670, 440)).toBe(false);
    expect(canStandAt(400, 280)).toBe(true);
  });
});
