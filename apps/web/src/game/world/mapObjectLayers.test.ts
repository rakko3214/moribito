import { describe, expect, it } from "vitest";
import { parseGameplayObjects } from "./mapObjectLayers.js";

describe("gameplay Tiled object layers", () => {
  it("normalizes coordinates and custom properties", () => {
    expect(parseGameplayObjects([{ id: 7, name: "workbench", type: "station", x: 330, y: 195, properties: [{ name: "action", value: "craft" }, { name: "chapter", value: 1 }] }])).toEqual([{ id: 7, name: "workbench", type: "station", x: 330, y: 195, width: 0, height: 0, properties: { action: "craft", chapter: 1 } }]);
  });
});
