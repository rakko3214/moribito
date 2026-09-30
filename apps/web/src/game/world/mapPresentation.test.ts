import { describe, expect, it } from "vitest";
import { getMapDecorations } from "./mapPresentation.js";

describe("map presentation", () => {
  it("expands the player home interior presentation in three stages", () => {
    const initial = getMapDecorations("map_home", []);
    const middle = getMapDecorations("map_home", ["construction:ordered:house_upgrade_1"]);
    const final = getMapDecorations("map_home", ["construction:ordered:house_upgrade_2"]);
    expect(initial.find((item) => item.kind === "label")?.text).toBe("祖父の古家");
    expect(middle.find((item) => item.kind === "label")?.text).toBe("修繕した家");
    expect(final.filter((item) => item.kind === "label").map((item) => item.text)).toEqual(["結師の家", "特別室"]);
    expect([initial.length, middle.length, final.length]).toEqual([2, 4, 7]);
  });
  it("shows village landmarks", () => {
    expect(getMapDecorations("map_village", []).filter((item) => item.kind === "label").map((item) => item.text)).toEqual(["結の広場", "診療所", "村長宅"]);
  });

  it("changes the old pond after Bakegaeru purification", () => {
    expect(getMapDecorations("map_old_pond", []).find((item) => item.kind === "label")?.text).toBe("穢れた古池");
    expect(getMapDecorations("map_old_pond", ["chapter2:bakegaeru_cleansed"]).find((item) => item.kind === "label")?.text).toBe("澄んだ古池");
  });

  it("changes the grove after the Yodomi Tree purification", () => {
    expect(getMapDecorations("map_yodomi_grove", []).find((item) => item.kind === "label")?.text).toBe("淀みの大樹");
    expect(getMapDecorations("map_yodomi_grove", ["chapter3:yodomi_tree_cleansed"]).find((item) => item.kind === "label")?.text).toBe("光の戻った木立");
  });
});
