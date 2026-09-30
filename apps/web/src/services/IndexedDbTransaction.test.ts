import { describe, expect, it, vi } from "vitest";
import { transactionCommitted } from "./IndexedDbTransaction.js";

describe("IndexedDB durability", () => {
  it("does not acknowledge a request before commit", async () => {
    const transaction = Object.assign(new EventTarget(), { error: null });
    const done = vi.fn();
    const pending = transactionCommitted(transaction).then(done);
    transaction.dispatchEvent(new Event("success"));
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    transaction.dispatchEvent(new Event("complete"));
    await pending;
    expect(done).toHaveBeenCalledOnce();
  });
  it.each(["abort", "error"])("rejects %s after request success", async (event) => {
    const transaction = Object.assign(new EventTarget(), { error: null });
    const pending = transactionCommitted(transaction);
    transaction.dispatchEvent(new Event("success"));
    transaction.dispatchEvent(new Event(event));
    await expect(pending).rejects.toThrow("IndexedDB transaction");
  });
});
