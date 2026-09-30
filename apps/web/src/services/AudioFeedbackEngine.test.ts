import { describe, expect, it } from "vitest";
import { AUDIO_CUES } from "./AudioFeedbackEngine.js";
describe("AudioFeedbackEngine cues", () => {
  it("defines short and distinct success, failure and damage cues", () => {
    expect(Object.keys(AUDIO_CUES)).toEqual(["success", "failure", "damage"]);
    expect(new Set(Object.values(AUDIO_CUES).map((cue) => cue.frequency)).size).toBe(3);
    expect(Object.values(AUDIO_CUES).every((cue) => cue.duration <= 0.25 && cue.endFrequency > 0)).toBe(true);
  });
  it("uses rising pitch for success and falling pitch for warnings", () => {
    expect(AUDIO_CUES.success.endFrequency).toBeGreaterThan(AUDIO_CUES.success.frequency);
    expect(AUDIO_CUES.failure.endFrequency).toBeLessThan(AUDIO_CUES.failure.frequency);
    expect(AUDIO_CUES.damage.endFrequency).toBeLessThan(AUDIO_CUES.damage.frequency);
  });
});
