import { describe, expect, it } from "vitest";
import { centeredCameraBounds, mapCameraZoom, mapFloorExtent } from "./mapCameraPresentation.js";

describe("mapCameraZoom", () => {
  it("centers small rooms on desktop and only pads height on mobile", () => {
    expect(centeredCameraBounds(640, 480, 1280, 720)).toEqual({ x: -320, y: -120, width: 1280, height: 720 });
    expect(centeredCameraBounds(640, 480, 390, 844)).toEqual({ x: 0, y: -182, width: 640, height: 844 });
    expect(centeredCameraBounds(1280, 800, 390, 640)).toEqual({ x: 0, y: 0, width: 1280, height: 800 });
  });
  it("keeps the authored pixel scale so fixed HUD elements stay on screen", () => {
    expect(mapCameraZoom("map_nagomi", 698, 480)).toBe(1);
    expect(mapCameraZoom("map_nagomi", 900, 480)).toBe(1);
  });
  it("keeps outdoor map navigation at the authored scale", () => {
    expect(mapCameraZoom("map_village", 698, 800)).toBe(1);
  });
  it("extends interior flooring behind tall viewports without changing physics bounds", () => {
    expect(mapFloorExtent("map_nagomi", 640, 480, 562, 698)).toEqual({ width: 640, height: 698 });
    expect(mapFloorExtent("map_village", 1280, 800, 562, 698)).toEqual({ width: 1280, height: 800 });
  });
});
