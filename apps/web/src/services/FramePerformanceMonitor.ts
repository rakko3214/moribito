export type PerformanceTier = "measuring" | "good" | "limited" | "poor";
export type PerformanceSnapshot = { tier: PerformanceTier; averageFps: number; lowFps: number; samples: number };
export class FramePerformanceMonitor {
  private previous: number | undefined; private readonly frames: number[] = [];
  constructor(private readonly sampleSize = 120) {}
  addFrame(timestamp: number): PerformanceSnapshot {
    if (this.previous !== undefined) {
      const delta = timestamp - this.previous;
      if (delta > 0 && delta < 250) { this.frames.push(1000 / delta); if (this.frames.length > this.sampleSize) this.frames.shift(); }
    }
    this.previous = timestamp;
    return this.snapshot();
  }
  reset() { this.previous = undefined; this.frames.length = 0; }
  snapshot(): PerformanceSnapshot {
    if (this.frames.length < Math.min(60, this.sampleSize)) return { tier: "measuring", averageFps: 0, lowFps: 0, samples: this.frames.length };
    const sorted = [...this.frames].sort((a, b) => a - b); const averageFps = this.frames.reduce((sum, fps) => sum + fps, 0) / this.frames.length;
    const lowFps = sorted[Math.max(0, Math.floor(sorted.length * 0.1) - 1)] ?? averageFps;
    const tier: PerformanceTier = averageFps >= 52 && lowFps >= 42 ? "good" : averageFps >= 38 && lowFps >= 28 ? "limited" : "poor";
    return { tier, averageFps: Math.round(averageFps), lowFps: Math.round(lowFps), samples: this.frames.length };
  }
}
