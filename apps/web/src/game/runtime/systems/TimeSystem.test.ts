import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { TimeSystem } from "./TimeSystem.js";

describe("TimeSystem sleep", () => {
  it("advances to the next day at 06:00", () => {
    const state = createInitialState(); state.time.minutes = 21 * 60;
    const time = new TimeSystem(() => state, vi.fn()); time.sleepUntilMorning();
    expect(state.time.day).toBe(2); expect(state.time.minutes).toBe(360);
  });
  it("rolls season and year after day 28", () => {
    const state = createInitialState(); state.time.day = 28; state.time.season = "winter"; state.time.year = 1;
    new TimeSystem(() => state, vi.fn()).sleepUntilMorning();
    expect(state.time).toMatchObject({ year: 2, season: "spring", day: 1, minutes: 360 });
  });
});
