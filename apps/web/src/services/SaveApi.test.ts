import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./SaveApi.js";

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
});
