import { describe, expect, it } from "vitest";
import { mapAccess } from "./progressionGate.js";

describe("map progression gates", () => {
  it("opens the old pond only after the shrine report", () => {
    expect(mapAccess("map_old_pond", { chapterTwoStep: "investigate_water", chapterThreeStep: "locked" }).allowed).toBe(false);
    expect(mapAccess("map_old_pond", { chapterTwoStep: "purify_bakegaeru", chapterThreeStep: "locked" }).allowed).toBe(true);
  });
  it("opens the forest after talking with Yota", () => {
    expect(mapAccess("map_forest", { chapterTwoStep: "complete", chapterThreeStep: "ask_yota" }).allowed).toBe(false);
    expect(mapAccess("map_forest", { chapterTwoStep: "complete", chapterThreeStep: "enter_forest" }).allowed).toBe(true);
  });
  it("keeps the grove closed until Kodama is witnessed", () => {
    expect(mapAccess("map_yodomi_grove", { chapterTwoStep: "complete", chapterThreeStep: "witness_kodama" }).allowed).toBe(false);
    expect(mapAccess("map_yodomi_grove", { chapterTwoStep: "complete", chapterThreeStep: "purify_tree" }).allowed).toBe(true);
  });
  it("does not restrict ordinary village facilities", () => {
    expect(mapAccess("map_clinic", { chapterTwoStep: "locked", chapterThreeStep: "locked" }).allowed).toBe(true);
  });
});
