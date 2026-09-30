import { describe, expect, it } from "vitest";
import { dangerEntryConfirmation } from "./dangerEntryConfirmation.js";

describe("danger entry confirmation", () => {
  it("prompts only when entering an active chapter boss area", () => {
    expect(dangerEntryConfirmation("map_old_pond", "purify_bakegaeru", "locked")?.title).toContain("古池");
    expect(dangerEntryConfirmation("map_yodomi_grove", "complete", "purify_tree")?.title).toContain("淀みの大樹");
    expect(dangerEntryConfirmation("map_old_pond", "complete", "locked")).toBeUndefined();
    expect(dangerEntryConfirmation("map_forest", "complete", "enter_forest")).toBeUndefined();
  });
});
