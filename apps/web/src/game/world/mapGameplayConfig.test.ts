import { describe, expect, it } from "vitest";
import { farmPlotsFromEventZone } from "./mapGameplayConfig.js";

describe("farmPlotsFromEventZone", () => {
  it("builds the configured farm grid in stable row order", () => {
    const plots = farmPlotsFromEventZone({ id: 1, name: "farming_tutorial", type: "tutorial", x: 0, y: 0, width: 0, height: 0, properties: { originX: 120, originY: 350, columns: 8, rows: 6, spacing: 42 } });
    expect(plots).toHaveLength(48);
    expect(plots[0]).toEqual({ id: "farm_1", x: 120, y: 350 });
    expect(plots[8]).toEqual({ id: "farm_9", x: 120, y: 392 });
    expect(plots[47]).toEqual({ id: "farm_48", x: 414, y: 560 });
  });

  it("rejects incomplete or fractional grid definitions", () => {
    expect(farmPlotsFromEventZone(undefined)).toEqual([]);
    expect(farmPlotsFromEventZone({ id: 1, name: "bad", type: "", x: 0, y: 0, width: 0, height: 0, properties: { originX: 0, originY: 0, columns: 2.5, rows: 1, spacing: 32 } })).toEqual([]);
  });
});
