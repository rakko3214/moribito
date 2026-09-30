import { describe, expect, it } from "vitest";
import { decideMiniGameExit } from "./MiniGameUiSystem.js";

describe("MiniGameUiSystem", () => {
  it("closes ordinary panels immediately", () => expect(decideMiniGameExit(false, 0, 100).action).toBe("close"));
  it("requires two close presses during a mini game", () => {
    const first = decideMiniGameExit(true, 0, 100);
    expect(first.action).toBe("arm");
    expect(decideMiniGameExit(true, first.armedUntil, 500).action).toBe("close");
  });
  it("expires the confirmation window", () => expect(decideMiniGameExit(true, 1_000, 2_000).action).toBe("arm"));
});
