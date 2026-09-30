import { describe, expect, it } from "vitest";
import { createInitialState } from "../game/runtime/initialState.js";
import { saveSummary } from "./SaveSummary.js";

describe("save summary", () => {
  it.each([["spring", "春"], ["summer", "夏"], ["autumn", "秋"], ["winter", "冬"]])("shows the saved %s season", (season, label) => {
    const save = createInitialState(); save.time = { year: 2, season, day: 12, minutes: 720 };
    expect(saveSummary(save)).toBe(`2年目 ${label} 12日・第1章から再開できます`);
  });
  it("does not advertise the unreleased fourth chapter", () => {
    const save = createInitialState();
    save.progression.chapter = 4; save.progression.storyStep = "first_playable_complete";
    expect(saveSummary(save)).toContain("第3章クリア後の暮らし");
    expect(saveSummary(save)).not.toContain("第4章");
  });
});
