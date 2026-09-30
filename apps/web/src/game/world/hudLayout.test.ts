import { describe, expect, it } from "vitest";
import { hudLayout } from "./hudLayout.js";
describe("HUD layout", () => {
  it("uses a compact collapsed layout on phones", () => { expect(hudLayout(390)).toEqual({ compact: true, contentWidth: 358, detailsDefaultVisible: false, questWidth: 358, actionRowY: 14, weatherY: 48, helpY: 0, questY: 78 }); });
  it("keeps detailed status collapsed on desktop", () => { expect(hudLayout(960)).toEqual({ compact: false, contentWidth: 928, detailsDefaultVisible: false, questWidth: 310, actionRowY: 14, weatherY: 48, helpY: 0, questY: 78 }); });
  it("uses the compact HUD on narrow landscape canvases", () => { expect(hudLayout(600)).toMatchObject({ compact: true, detailsDefaultVisible: false, questWidth: 358 }); });
  it("keeps narrow screens readable", () => { expect(hudLayout(240).contentWidth).toBe(220); });
});
