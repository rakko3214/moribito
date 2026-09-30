import { describe, expect, it } from "vitest";
import { diagnoseBrowser, shouldRetrySaveAfterReconnect, type BrowserCapabilityEnvironment } from "./BrowserCapability.js";

const capable: BrowserCapabilityEnvironment = { width: 390, height: 844, online: true, maxTouchPoints: 5, audioContext: true, vibration: true, localStorage: true, webgl: true };

describe("diagnoseBrowser", () => {
  it("accepts a capable portrait mobile browser", () => {
    const result = diagnoseBrowser(capable);
    expect(result.supported).toBe(true); expect(result.orientation).toBe("portrait"); expect(result.touch).toBe(true); expect(result.issues).toEqual([]);
  });
  it("recommends portrait without blocking landscape play", () => {
    const result = diagnoseBrowser({ ...capable, width: 844, height: 390 });
    expect(result.supported).toBe(true); expect(result.issues).toContainEqual(expect.objectContaining({ code: "landscape", severity: "warning" }));
  });
  it("blocks browsers without storage or WebGL", () => {
    const result = diagnoseBrowser({ ...capable, localStorage: false, webgl: false });
    expect(result.supported).toBe(false); expect(result.issues.filter((issue) => issue.severity === "error")).toHaveLength(2);
  });
  it("reports offline and optional feedback limitations as warnings", () => {
    const result = diagnoseBrowser({ ...capable, online: false, audioContext: false, vibration: false });
    expect(result.supported).toBe(true); expect(result.issues.map((issue) => issue.code)).toEqual(["offline", "audio", "vibration"]);
  });

  it("retries an unsaved active game after connectivity returns", () => {
    expect(shouldRetrySaveAfterReconnect("game", "dirty")).toBe(true);
    expect(shouldRetrySaveAfterReconnect("game", "error")).toBe(true);
    expect(shouldRetrySaveAfterReconnect("menu", "dirty")).toBe(false);
    expect(shouldRetrySaveAfterReconnect("game", "saved")).toBe(false);
  });
});
