import { describe, expect, it } from "vitest";
import { cookingGameLayout } from "./cookingGameLayout.js";

describe("cookingGameLayout", () => {
  it.each([[390, 488], [562, 698], [1280, 720]])("keeps the cooking controls inside a %sx%s viewport", (width, height) => {
    const layout = cookingGameLayout(width, height);
    expect(layout.adviceX - layout.adviceWidth / 2).toBeGreaterThanOrEqual(12);
    expect(layout.adviceX + layout.adviceWidth / 2).toBeLessThanOrEqual(width - 12);
    expect(layout.potX - 58).toBeGreaterThanOrEqual(12);
    expect(layout.gaugeX + 58).toBeLessThanOrEqual(width - 12);
    expect(layout.footerY + 24).toBeLessThanOrEqual(height - 12);
  });
});
