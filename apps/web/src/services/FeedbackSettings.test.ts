import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FEEDBACK_SETTINGS, feedbackPattern, loadFeedbackSettings, saveFeedbackSettings } from "./FeedbackSettings.js";
describe("FeedbackSettings", () => {
  it("uses defaults for missing or corrupt values", () => {
    expect(loadFeedbackSettings({ getItem: () => null })).toEqual(DEFAULT_FEEDBACK_SETTINGS);
    expect(loadFeedbackSettings({ getItem: () => "{" })).toEqual(DEFAULT_FEEDBACK_SETTINGS);
  });
  it("clamps volumes and restores boolean preferences", () => {
    const settings = loadFeedbackSettings({ getItem: () => JSON.stringify({ bgm: 2, se: -1, asmr: 0.4, vibration: false, reducedMotion: true }) });
    expect(settings).toMatchObject({ bgm: 1, se: 0, asmr: 0.4, vibration: false, reducedMotion: true, movementSensitivity: 1, screenShake: true, reducedEffects: false });
  });
  it("persists settings and defines distinct feedback patterns", () => {
    const setItem = vi.fn(); saveFeedbackSettings({ setItem }, DEFAULT_FEEDBACK_SETTINGS);
    expect(setItem).toHaveBeenCalledWith("moribito:feedback-settings:v1", JSON.stringify(DEFAULT_FEEDBACK_SETTINGS));
    expect(feedbackPattern("damage")).not.toEqual(feedbackPattern("success"));
  });
  it("restores accessibility options while keeping old saved settings compatible", () => {
    const old = loadFeedbackSettings({ getItem: () => JSON.stringify({ vibration: false }) });
    expect(old).toMatchObject({ vibration: false, largeText: false, highContrast: false, combatCues: true });
    const accessible = loadFeedbackSettings({ getItem: () => JSON.stringify({ largeText: true, highContrast: true, combatCues: false }) });
    expect(accessible).toMatchObject({ largeText: true, highContrast: true, combatCues: false });
  });
});
