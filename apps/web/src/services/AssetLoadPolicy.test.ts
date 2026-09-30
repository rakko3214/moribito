import { describe, expect, it } from "vitest";
import { assetFailureMessage, classifyAssetFailure, normalizeLoadProgress } from "./AssetLoadPolicy.js";

describe("asset load policy", () => {
  it("treats required maps as fatal and presentation images as warnings", () => {
    expect(classifyAssetFailure("map-village", "tilemapJSON")).toBe("fatal");
    expect(classifyAssetFailure("homestead-grass", "image")).toBe("warning");
    expect(assetFailureMessage("map-village", "fatal")).toContain("必須マップ");
  });
  it("normalizes loader progress for UI", () => {
    expect(normalizeLoadProgress(0.456)).toBe(46); expect(normalizeLoadProgress(-1)).toBe(0);
    expect(normalizeLoadProgress(2)).toBe(100); expect(normalizeLoadProgress(Number.NaN)).toBe(0);
  });
});
