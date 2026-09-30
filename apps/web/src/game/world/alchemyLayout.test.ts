import { describe, expect, it } from "vitest";
import { alchemyLayout } from "./alchemyLayout.js";
describe("alchemy phone layout", () => {
  it.each([[360, 640], [390, 844], [1280, 720]])("keeps bowl and instructions within %sx%s", (width, height) => {
    const layout = alchemyLayout(width, height);
    expect(layout.bowlX - 80).toBeGreaterThan(0);
    expect(layout.bowlX + 80).toBeLessThan(width);
    expect(layout.instructionX - layout.textWidth / 2).toBeGreaterThanOrEqual(0);
    expect(layout.instructionX + layout.textWidth / 2).toBeLessThanOrEqual(width);
    expect(layout.guideY + 20).toBeLessThan(height);
    if (width < 600) expect(layout.instructionY + 32).toBeLessThan(layout.bowlY - 74);
  });
});
