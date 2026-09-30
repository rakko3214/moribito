import { describe, expect, it } from "vitest";
import { validateMapWalkability, validateTiledMap, validateWorldMapSet } from "./mapValidation.js";

describe("Tiled map validation", () => {
  it("reports unsafe dimensions, missing layers and broken transitions", () => {
    const issues = validateTiledMap({ width: 1, height: 1, tilewidth: 16, tileheight: 16, properties: [], layers: [{ name: "transitions", type: "objectgroup", objects: [{ id: 1, name: "exit", x: 0, y: 0, width: 0, height: 0 }] }] }, ["collisions", "spawns", "transitions"]);
    expect(issues).toEqual(expect.arrayContaining(["tile size must be 32x32", "missing object layer: collisions", "missing object layer: spawns", "transition exit must have positive size", "transition exit missing destination"]));
  });
  it("reports blocked spawns and broken cross-map destinations", () => {
    const issues = validateWorldMapSet({ map_a: { layers: [{ name: "collisions", objects: [{ x: 0, y: 0, width: 20, height: 20 }] }, { name: "spawns", objects: [{ name: "start", x: 10, y: 10 }] }, { name: "transitions", objects: [{ name: "exit", properties: [{ name: "targetMap", value: "map_b" }, { name: "targetSpawn", value: "missing" }] }] }] } });
    expect(issues).toEqual(["map_a spawn start overlaps collision with player footprint", "map_a transition exit targets unknown map"]);
  });
  it("rejects a spawn whose point is clear but player body overlaps a wall", () => {
    const issues = validateWorldMapSet({ map_a: { layers: [
      { name: "collisions", objects: [{ name: "wall", x: 40, y: 40, width: 40, height: 40 }] },
      { name: "spawns", objects: [{ name: "door", x: 52, y: 92 }] },
      { name: "transitions", objects: [] },
    ] } });
    expect(issues).toEqual(["map_a spawn door overlaps collision with player footprint"]);
  });
  it("rejects one-way and fully blocked entrances", () => {
    const maps = {
      map_a: { layers: [
        { name: "collisions", objects: [{ name: "wall", x: 0, y: 0, width: 40, height: 40 }] },
        { name: "spawns", objects: [{ name: "start", x: 80, y: 80 }] },
        { name: "transitions", objects: [{ name: "door", x: 5, y: 5, width: 20, height: 20, properties: [{ name: "targetMap", value: "map_b" }, { name: "targetSpawn", value: "start" }] }] },
      ] },
      map_b: { layers: [
        { name: "collisions", objects: [] },
        { name: "spawns", objects: [{ name: "start", x: 80, y: 80 }] },
        { name: "transitions", objects: [] },
      ] },
    };
    expect(validateWorldMapSet(maps)).toEqual([
      "map_a transition door is fully blocked by collision",
      "map_a transition door has no return path from map_b",
    ]);
  });
  it("reports a walkable-looking entrance isolated behind a wall", () => {
    const issues = validateMapWalkability("map_test", {
      width: 10, height: 10, tilewidth: 32, tileheight: 32,
      layers: [
        { name: "collisions", objects: [{ name: "divider", x: 145, y: 0, width: 30, height: 320 }] },
        { name: "spawns", objects: [{ name: "start", x: 80, y: 160, point: true }] },
        { name: "transitions", objects: [{ name: "exit", x: 230, y: 130, width: 40, height: 60 }] },
      ],
    });
    expect(issues).toEqual(["map_test transition exit is unreachable"]);
  });
  it("reports invalid gameplay object layer data", () => {
    const issues = validateTiledMap({ width: 10, height: 10, tilewidth: 32, tileheight: 32, properties: [{ name: "displayName", value: "test" }, { name: "background", value: "#000" }, { name: "accent", value: "#fff" }], layers: [
      { name: "interactables", type: "objectgroup", objects: [{ id: 1, name: "station", x: 1, y: 1 }, { id: 2, name: "station", x: 2, y: 2 }] },
      { name: "eventZones", type: "objectgroup", objects: [{ id: 3, name: "tutorial", x: 0, y: 0, width: 20, height: 20 }] },
      { name: "gatheringNodes", type: "objectgroup", objects: [{ id: 4, name: "wood", x: 3, y: 3, point: false, properties: [{ name: "quantity", value: 0 }] }] },
      { name: "npcSpawns", type: "objectgroup", objects: [{ id: 5, name: "villager", x: 4, y: 4, point: false }] },
    ] }, []);
    expect(issues).toEqual(expect.arrayContaining(["interactable station missing label or marker", "interactables has duplicate object name: station", "event zone tutorial missing eventId", "gathering node wood has invalid item, quantity or tool", "gathering node wood must be a point", "npc spawn villager missing schedule", "npc spawn villager must be a point"]));
  });
});
