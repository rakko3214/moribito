import { describe, expect, it } from "vitest";
import { createNewSnapshot, SAVE_KEY } from "../domain/save.js";
import { DeviceSave } from "./DeviceSave.js";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: (key: string) => key === SAVE_KEY ? value : null,
    setItem: (key: string, next: string) => { if (key === SAVE_KEY) value = next; },
    raw: () => value,
  };
}

describe("production device save", () => {
  const id = "14c045e8-905b-41d7-9e79-b64ccde056b0";

  it("starts, saves movement, and resumes from the new namespace", async () => {
    const storage = memoryStorage();
    const saves = new DeviceSave(storage, undefined, () => "2026-09-30T00:00:00.000Z", () => id);
    const started = await saves.startNew();
    expect(started.revision).toBe(0);
    const moved = await saves.save(started, { ...started.state.player, x: 421, facing: "right" });
    expect(moved.revision).toBe(1);
    expect(new DeviceSave(storage).load()?.state.player).toMatchObject({ x: 421, facing: "right" });
  });

  it("rejects an old tab after a new game replaces its save", async () => {
    const storage = memoryStorage();
    const oldSave = createNewSnapshot(id);
    storage.setItem(SAVE_KEY, JSON.stringify(oldSave));
    const saves = new DeviceSave(storage, undefined, undefined, () => "a68be7bc-493e-44a8-a53d-f73ce2bc8343");
    await saves.startNew();
    await expect(saves.save(oldSave, oldSave.state.player)).rejects.toThrow("別のタブ");
  });

  it("retains invalid data and the prior save when storage fails", async () => {
    const invalid = memoryStorage("{broken");
    expect(() => new DeviceSave(invalid).load()).toThrow("元のデータは保持");
    expect(invalid.raw()).toBe("{broken");

    const initial = createNewSnapshot(id);
    const storage = {
      getItem: () => JSON.stringify(initial),
      setItem: () => { throw new Error("quota"); },
    };
    await expect(new DeviceSave(storage).save(initial, initial.state.player)).rejects.toThrow("quota");
    expect(JSON.parse(storage.getItem()).revision).toBe(0);
  });
});
