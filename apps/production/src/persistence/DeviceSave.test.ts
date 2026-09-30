import { describe, expect, it } from "vitest";
import { createNewSnapshot, SAVE_KEY } from "../domain/save.js";
import { DeviceSave, SaveConflictError, SaveStorageError } from "./DeviceSave.js";

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

  it("writes the latest position synchronously on pagehide and rejects a stale tab", async () => {
    const storage = memoryStorage();
    const saves = new DeviceSave(storage, undefined, () => "2026-09-30T00:00:00.000Z", () => id);
    const started = await saves.startNew();
    const hidden = saves.saveBeforeUnload(started, { ...started.state.player, x: 432 });
    expect(hidden.revision).toBe(1);
    expect(new DeviceSave(storage).load()?.state.player.x).toBe(432);
    expect(() => saves.saveBeforeUnload(started, started.state.player)).toThrow(SaveConflictError);
    expect(new DeviceSave(storage).load()?.state.player.x).toBe(432);
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
    await expect(new DeviceSave(storage).save(initial, initial.state.player)).rejects.toThrow(SaveStorageError);
    expect(() => new DeviceSave(storage).saveBeforeUnload(initial, initial.state.player)).toThrow(SaveStorageError);
    expect(JSON.parse(storage.getItem()).revision).toBe(0);
  });

  it("allows retry after a temporary storage failure", async () => {
    const started = createNewSnapshot(id);
    let raw = JSON.stringify(started);
    let fail = true;
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        if (fail) { fail = false; throw new Error("quota"); }
        raw = value;
      },
    };
    const saves = new DeviceSave(storage);
    await expect(saves.save(started, { ...started.state.player, x: 450 })).rejects.toThrow("再試行してください");
    expect(JSON.parse(raw).revision).toBe(0);
    const recovered = await saves.save(started, { ...started.state.player, x: 450 });
    expect(recovered.revision).toBe(1);
    expect(saves.load()?.state.player.x).toBe(450);
  });

  it("reports denied storage access without corrupting the save", () => {
    const saves = new DeviceSave({
      getItem: () => { throw new Error("denied"); },
      setItem: () => { throw new Error("denied"); },
    });
    expect(() => saves.load()).toThrow("保存データにアクセスできません");
  });
});
