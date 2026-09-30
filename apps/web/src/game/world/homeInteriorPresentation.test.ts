import { describe, expect, it } from "vitest";
import { HOME_INTERIOR_SPRITE_SHEET, homeInteriorFrame } from "./homeInteriorPresentation.js";

describe("home interior presentation", () => {
  it("follows the three construction stages", () => {
    expect(homeInteriorFrame([])).toBe(0);
    expect(homeInteriorFrame(["construction:ordered:house_upgrade_1"])).toBe(1);
    expect(homeInteriorFrame(["construction:ordered:house_upgrade_2"])).toBe(2);
  });
  it("uses the verified three-column source size", () => {
    expect(HOME_INTERIOR_SPRITE_SHEET).toMatchObject({ frameWidth: 724, frameHeight: 724 });
  });
});
