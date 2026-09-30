import { describe, expect, it } from "vitest";
import { homeUpgradeProfile, homeUpgradeStage } from "./HomeUpgrade.js";

describe("homeUpgradeStage", () => {
  it("resolves all three visual stages", () => {
    expect(homeUpgradeStage([])).toBe(0);
    expect(homeUpgradeStage(["construction:ordered:house_upgrade_1"])).toBe(1);
    expect(homeUpgradeStage(["construction:ordered:house_upgrade_1", "construction:ordered:house_upgrade_2"])).toBe(2);
  });
  it("keeps legacy expansion saves at the middle stage", () => {
    expect(homeUpgradeStage(["construction:ordered:house_expansion"])).toBe(1);
  });
  it("provides progressively larger indoor furniture limits", () => {
    expect(homeUpgradeProfile([])).toMatchObject({ name: "祖父の古家", furnitureLimit: 6 });
    expect(homeUpgradeProfile(["construction:ordered:house_upgrade_1"]).furnitureLimit).toBe(12);
    expect(homeUpgradeProfile(["construction:ordered:house_upgrade_2"]).furnitureLimit).toBe(20);
  });
  it("expands the usable indoor placement area with each upgrade", () => {
    expect(homeUpgradeProfile([]).placementBounds).toEqual({ x: 80, y: 90, width: 480, height: 260 });
    expect(homeUpgradeProfile(["construction:ordered:house_upgrade_1"]).placementBounds.width).toBeGreaterThan(480);
    expect(homeUpgradeProfile(["construction:ordered:house_upgrade_2"]).placementBounds.width).toBeGreaterThan(522);
  });
});
