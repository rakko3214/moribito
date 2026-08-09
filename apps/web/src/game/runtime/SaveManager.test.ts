import { describe, expect, it, vi } from "vitest";
import { SaveManager, type SaveStatus } from "./SaveManager.js";

describe("SaveManager", () => {
  it("auto-saves dirty state after the configured interval", () => {
    const send = vi.fn();
    const manager = new SaveManager(send, vi.fn(), { autoSaveIntervalMs: 1000 });
    manager.load(false);
    manager.markDirty();
    manager.update(999);
    expect(send).not.toHaveBeenCalled();
    manager.update(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("defers a request until saving becomes safe", () => {
    const send = vi.fn();
    const manager = new SaveManager(send, vi.fn());
    manager.load(true);
    manager.setSafeToSave(false);
    manager.request();
    expect(send).not.toHaveBeenCalled();
    manager.setSafeToSave(true);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("preserves changes made during an active save", () => {
    const statuses: SaveStatus[] = [];
    const manager = new SaveManager(vi.fn(), (status) => statuses.push(status));
    manager.load(true);
    manager.request();
    manager.markDirty();
    manager.completed();
    expect(statuses.at(-1)).toBe("dirty");
  });

  it("coalesces another request made while saving", () => {
    const send = vi.fn();
    const manager = new SaveManager(send, vi.fn());
    manager.load(true);
    manager.request();
    manager.markDirty();
    manager.request();
    manager.completed();
    expect(send).toHaveBeenCalledTimes(2);
  });
});
