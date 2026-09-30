import type { FeedbackSettings } from "./FeedbackSettings.js";

export type AudioCueKind = "success" | "failure" | "damage";
export type AudioChannel = "se" | "asmr";
export const AUDIO_CUES: Record<AudioCueKind, { frequency: number; endFrequency: number; duration: number; wave: OscillatorType }> = {
  success: { frequency: 520, endFrequency: 760, duration: 0.16, wave: "sine" },
  failure: { frequency: 260, endFrequency: 170, duration: 0.22, wave: "triangle" },
  damage: { frequency: 120, endFrequency: 72, duration: 0.18, wave: "square" },
};

export class AudioFeedbackEngine {
  private context: AudioContext | undefined;
  private settings: Pick<FeedbackSettings, "bgm" | "se" | "asmr"> = { bgm: 0.7, se: 0.8, asmr: 0.65 };
  private ambientTimer: ReturnType<typeof setInterval> | undefined;
  update(settings: FeedbackSettings) { this.settings = { bgm: settings.bgm, se: settings.se, asmr: settings.asmr }; }
  private audioContext() {
    const Context = window.AudioContext;
    if (!Context) return undefined;
    this.context ??= new Context();
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }
  play(kind: AudioCueKind, channel: AudioChannel = "se") {
    const volume = this.settings[channel]; if (volume <= 0) return false;
    const context = this.audioContext(); if (!context) return false;
    const cue = AUDIO_CUES[kind]; const now = context.currentTime;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = channel === "asmr" && kind === "success" ? "sine" : cue.wave;
    oscillator.frequency.setValueAtTime(channel === "asmr" ? cue.frequency * 0.72 : cue.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, channel === "asmr" ? cue.endFrequency * 0.72 : cue.endFrequency), now + cue.duration);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * (channel === "asmr" ? 0.08 : 0.12)), now + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + cue.duration + 0.02);
    return true;
  }
  startAmbient() {
    if (this.ambientTimer || this.settings.bgm <= 0) return;
    const play = () => this.playAmbientTone(); play(); this.ambientTimer = setInterval(play, 4_800);
  }
  stopAmbient() { if (this.ambientTimer) clearInterval(this.ambientTimer); this.ambientTimer = undefined; }
  private playAmbientTone() {
    const context = this.audioContext(); if (!context || this.settings.bgm <= 0) return;
    const now = context.currentTime; const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.setValueAtTime(196, now); oscillator.frequency.linearRampToValueAtTime(220, now + 2.4);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.settings.bgm * 0.025), now + 0.35); gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + 2.85);
  }
  destroy() { this.stopAmbient(); if (this.context) void this.context.close(); this.context = undefined; }
}
