import { describe, expect, it } from "vitest";
import { DeviceSave, withDeviceSaveLock } from "./DeviceSave.js";
import { createInitialState } from "../game/runtime/initialState.js";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe("device-only saves", () => {
  it("starts offline, saves, restores and resets without a server", () => {
    const store = storage(); const device = new DeviceSave(store);
    expect(device.load()).toBeNull();
    expect(device.save(createInitialState()).revision).toBe(1);
    expect(new DeviceSave(store).load()?.revision).toBe(1);
    device.reset(); expect(device.load()).toBeNull();
  });
  it("does not overwrite a newer revision", () => {
    const device = new DeviceSave(storage()); const save = createInitialState();
    device.save(save);
    expect(() => device.save(save)).toThrow("別のタブ");
    expect(device.load()?.revision).toBe(1);
  });
  it("retains corrupt data rather than treating it as an empty slot", () => {
    const store = storage(); store.setItem("moribito.save-cache.local-user", "broken");
    expect(() => new DeviceSave(store).load()).toThrow("データは削除せず保持");
    expect(store.getItem("moribito.save-cache.local-user")).toBe("broken");
  });
  it("never reports success on quota failure", () => {
    const store = storage(); store.setItem = () => { throw new Error("quota"); };
    expect(() => new DeviceSave(store).save(createInitialState())).toThrow("端末に保存できません");
  });
  it("does not resurrect a save cleared by another tab", () => {
    const device = new DeviceSave(storage());
    device.save(createInitialState());
    const stale = device.load()!;
    device.reset();
    expect(() => device.save(stale)).toThrow("別のタブ");
    expect(device.load()).toBeNull();
  });
  it("preserves the last save when writing fails", () => {
    const store = storage(); const device = new DeviceSave(store);
    device.save(createInitialState());
    const saved = device.load()!;
    store.setItem = () => { throw new Error("quota"); };
    expect(() => device.save(saved)).toThrow("端末に保存できません");
    expect(device.load()).toEqual(saved);
  });
  it("uses the same exclusive lock for mutations", async () => {
    const names: string[] = [];
    const locks = { request: async (name: string, callback: () => unknown) => {
      names.push(name); return callback();
    } } as unknown as Pick<LockManager, "request">;
    expect(await withDeviceSaveLock(() => 42, locks)).toBe(42);
    expect(names).toEqual(["moribito.device-save"]);
  });
  it("propagates fallback errors as rejected promises", async () => {
    await expect(withDeviceSaveLock(() => { throw new Error("failed"); })).rejects.toThrow("failed");
  });
});
