import { describe, expect, it } from "vitest";
import { findRoute } from "./navigationGuide.js";
import type { MapId } from "./mapTypes.js";
import { routeEdgeKeys, WORLD_MAP_EDGES, WORLD_MAP_NODES, worldMapEdgeKey } from "./worldMapPresentation.js";

describe("worldMapPresentation", () => {
  it("defines a visual node for every playable map", () => {
    expect(Object.keys(WORLD_MAP_NODES)).toHaveLength(16);
  });

  it("only connects known nodes without duplicate edges", () => {
    const keys = WORLD_MAP_EDGES.map(([from, to]) => {
      expect(WORLD_MAP_NODES[from]).toBeDefined();
      expect(WORLD_MAP_NODES[to]).toBeDefined();
      return worldMapEdgeKey(from, to);
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("highlights each leg of the objective route", () => {
    const route = findRoute("map_home", "map_yodomi_grove");
    const highlighted = routeEdgeKeys(route);
    for (let index = 1; index < route.length; index += 1) {
      expect(highlighted.has(worldMapEdgeKey(route[index - 1] as MapId, route[index] as MapId))).toBe(true);
    }
  });
});
