import { describe, expect, it } from "vitest";
import { isCookingWorkPosition } from "./stationInteractionZones.js";

describe("station interaction zones", () => {
  it("accepts the accessible floor in front of Nagomi's preparation counter", () => {
    expect(isCookingWorkPosition("map_nagomi", 410, 400)).toBe(true);
    expect(isCookingWorkPosition("map_nagomi", 350, 360)).toBe(true);
  });
  it("does not activate cooking through the counter or in other maps", () => {
    expect(isCookingWorkPosition("map_nagomi", 410, 320)).toBe(false);
    expect(isCookingWorkPosition("map_home", 410, 400)).toBe(false);
  });
});
