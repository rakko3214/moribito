import { describe, expect, it } from "vitest";
import { FramePerformanceMonitor } from "./FramePerformanceMonitor.js";
const feed = (monitor: FramePerformanceMonitor, delta: number, count = 80) => { let now = 0; for (let i = 0; i < count; i += 1) { monitor.addFrame(now); now += delta; } return monitor.snapshot(); };
describe("FramePerformanceMonitor", () => {
  it("waits for a stable sample window", () => { const monitor = new FramePerformanceMonitor(); expect(monitor.addFrame(0).tier).toBe("measuring"); expect(monitor.addFrame(16).tier).toBe("measuring"); });
  it("classifies smooth, limited and poor devices", () => {
    expect(feed(new FramePerformanceMonitor(), 16.67).tier).toBe("good");
    expect(feed(new FramePerformanceMonitor(), 24).tier).toBe("limited");
    expect(feed(new FramePerformanceMonitor(), 34).tier).toBe("poor");
  });
  it("ignores long background-tab gaps and can reset", () => {
    const monitor = new FramePerformanceMonitor(60); monitor.addFrame(0); monitor.addFrame(1000); expect(monitor.snapshot().samples).toBe(0);
    feed(monitor, 16.67, 65); expect(monitor.snapshot().tier).toBe("good"); monitor.reset(); expect(monitor.snapshot().tier).toBe("measuring");
  });
});
