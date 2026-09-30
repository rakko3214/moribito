export type FeedbackSettings = { bgm: number; se: number; asmr: number; vibration: boolean; reducedMotion: boolean; movementSensitivity: number; screenShake: boolean; reducedEffects: boolean; largeText: boolean; highContrast: boolean; combatCues: boolean };
export const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = { bgm: 0.7, se: 0.8, asmr: 0.65, vibration: true, reducedMotion: false, movementSensitivity: 1, screenShake: true, reducedEffects: false, largeText: false, highContrast: false, combatCues: true };
const KEY = "moribito:feedback-settings:v1";
const volume = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
export function loadFeedbackSettings(storage: Pick<Storage, "getItem">): FeedbackSettings {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? "null") as Partial<FeedbackSettings> | null;
    if (!parsed) return { ...DEFAULT_FEEDBACK_SETTINGS };
    return { bgm: volume(parsed.bgm, 0.7), se: volume(parsed.se, 0.8), asmr: volume(parsed.asmr, 0.65), vibration: typeof parsed.vibration === "boolean" ? parsed.vibration : true, reducedMotion: typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : false, movementSensitivity: typeof parsed.movementSensitivity === "number" ? Math.max(0.8, Math.min(1.2, parsed.movementSensitivity)) : 1, screenShake: typeof parsed.screenShake === "boolean" ? parsed.screenShake : true, reducedEffects: typeof parsed.reducedEffects === "boolean" ? parsed.reducedEffects : false, largeText: typeof parsed.largeText === "boolean" ? parsed.largeText : false, highContrast: typeof parsed.highContrast === "boolean" ? parsed.highContrast : false, combatCues: typeof parsed.combatCues === "boolean" ? parsed.combatCues : true };
  } catch { return { ...DEFAULT_FEEDBACK_SETTINGS }; }
}
export function saveFeedbackSettings(storage: Pick<Storage, "setItem">, settings: FeedbackSettings) { storage.setItem(KEY, JSON.stringify(settings)); }
export function feedbackPattern(kind: "success" | "failure" | "damage") { return ({ success: [18], failure: [30, 35, 30], damage: [55] } as const)[kind]; }
