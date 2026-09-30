import { describe, expect, it } from "vitest";
import { exitLabel, findRoute, formatRoute, MAP_DISPLAY_NAMES, nextRouteMap, objectiveDestination } from "./navigationGuide.js";

describe("navigation guide", () => {
  it("provides a readable name for every map", () => {
    expect(Object.keys(MAP_DISPLAY_NAMES)).toHaveLength(16);
    expect(MAP_DISPLAY_NAMES.map_old_pond).toBe("古池");
  });
  it("guides each chapter to its dedicated gameplay map", () => {
    expect(objectiveDestination(1, "first_purification")).toBe("map_shrine_approach");
    expect(objectiveDestination(2, "purify_bakegaeru")).toBe("map_old_pond");
    expect(objectiveDestination(3, "follow_clues")).toBe("map_forest_depths");
    expect(objectiveDestination(3, "purify_tree")).toBe("map_yodomi_grove");
  });
  it("formats exit destinations", () => expect(exitLabel("map_village")).toBe("→ 結の村"));
  it("finds the shortest route across connected areas", () => {
    expect(findRoute("map_home", "map_old_pond")).toEqual(["map_home", "map_homestead", "map_village", "map_river", "map_old_pond"]);
    expect(formatRoute(findRoute("map_shrine", "map_clinic"))).toBe("結守神社 → 神社参道 → 結の村 → 診療所");
  });
  it("returns only the next exit needed for a waypoint", () => {
    expect(nextRouteMap("map_home", "map_old_pond")).toBe("map_homestead");
    expect(nextRouteMap("map_old_pond", "map_old_pond")).toBeUndefined();
  });
});
