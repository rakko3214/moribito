import { describe, expect, it, vi } from "vitest";
import { bindLifecycleSave, type LifecycleScreen } from "./LifecycleSave.js";

describe("lifecycle save", () => {
  it("requests a save when active play moves to the background", () => {
    const documentTarget = new EventTarget() as EventTarget & { visibilityState: string }; documentTarget.visibilityState = "hidden";
    const windowTarget = new EventTarget(); const request = vi.fn(); const screen: LifecycleScreen = "game";
    const unbind = bindLifecycleSave(documentTarget, windowTarget, () => screen, request);
    documentTarget.dispatchEvent(new Event("visibilitychange")); windowTarget.dispatchEvent(new Event("pagehide"));
    expect(request).toHaveBeenCalledTimes(2);
    unbind(); documentTarget.dispatchEvent(new Event("visibilitychange")); expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not save from authentication, loading or title screens", () => {
    const documentTarget = new EventTarget() as EventTarget & { visibilityState: string }; documentTarget.visibilityState = "hidden";
    const windowTarget = new EventTarget(); const request = vi.fn(); const screen: LifecycleScreen = "title";
    bindLifecycleSave(documentTarget, windowTarget, () => screen, request);
    documentTarget.dispatchEvent(new Event("visibilitychange")); windowTarget.dispatchEvent(new Event("pagehide"));
    expect(request).not.toHaveBeenCalled();
  });
});
