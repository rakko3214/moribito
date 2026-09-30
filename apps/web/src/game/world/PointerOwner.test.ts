import { describe, expect, it } from "vitest";
import { PointerOwner } from "./PointerOwner.js";

describe("gesture pointer ownership", () => {
  it("ignores a second finger and its release", () => {
    const owner = new PointerOwner();
    expect(owner.begin(1)).toBe(true);
    expect(owner.begin(2)).toBe(false);
    expect(owner.end(2)).toBe(false);
    expect(owner.owns(1)).toBe(true);
    expect(owner.end(1)).toBe(true);
    expect(owner.begin(2)).toBe(true);
  });
  it("requires a fresh gesture after interruption", () => {
    const owner = new PointerOwner();
    owner.begin(0);
    owner.cancel();
    expect(owner.owns(0)).toBe(false);
    expect(owner.end(0)).toBe(false);
    expect(owner.begin(0)).toBe(true);
  });
});
