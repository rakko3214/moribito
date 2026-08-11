import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../game/runtime/initialState.js";
import { discardPendingSave, recoverPendingSave, SaveRequestError, withRetry } from "./SaveApi.js";

describe("Save API retry", () => {
  it("retries with 1, 2 and 4 second backoff", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue("saved");
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(operation, [1000, 2000, 4000], sleep)).resolves.toBe("saved");
    expect(sleep.mock.calls).toEqual([[1000], [2000], [4000]]);
  });

  it("does not retry a revision conflict", async () => {
    const operation = vi.fn().mockRejectedValue(new SaveRequestError("newer cloud save", "conflict"));
    const sleep = vi.fn();
    await expect(withRetry(operation, [1000, 2000], sleep)).rejects.toMatchObject({ kind: "conflict" });
    expect(operation).toHaveBeenCalledTimes(1); expect(sleep).not.toHaveBeenCalled();
  });

  it("replays a pending save only when its base revision matches the cloud", async () => {
    const cloud = createInitialState(); cloud.revision = 4;
    const pending = createInitialState(); pending.revision = 4; pending.player.money = 777;
    const store = { load: vi.fn().mockResolvedValue({ userId: "user-a", baseRevision: 4, saveData: pending, createdAt: "now" }), clear: vi.fn().mockResolvedValue(undefined) };
    const upload = vi.fn().mockResolvedValue({ revision: 5, savedAt: "2026-08-11T00:00:00.000Z" });
    const restored = await recoverPendingSave(cloud, "user-a", store, upload);
    expect(upload).toHaveBeenCalledWith(pending); expect(store.clear).toHaveBeenCalledWith("user-a");
    expect(restored).toMatchObject({ pendingConflict: false, save: { revision: 5, player: { money: 777 } } });
  });

  it("keeps the cloud save authoritative when revisions differ", async () => {
    const cloud = createInitialState(); cloud.revision = 6;
    const pending = createInitialState(); pending.revision = 4;
    const store = { load: vi.fn().mockResolvedValue({ userId: "user-a", baseRevision: 4, saveData: pending, createdAt: "now" }), clear: vi.fn() };
    const upload = vi.fn();
    await expect(recoverPendingSave(cloud, "user-a", store, upload)).resolves.toEqual({ save: cloud, pendingConflict: true });
    expect(upload).not.toHaveBeenCalled(); expect(store.clear).not.toHaveBeenCalled();
  });

  it("discards only the selected user's pending save", async () => {
    const store = { clear: vi.fn().mockResolvedValue(undefined) };
    await discardPendingSave("user-b", store);
    expect(store.clear).toHaveBeenCalledWith("user-b");
  });
});
