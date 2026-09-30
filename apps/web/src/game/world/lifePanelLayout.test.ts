import { describe, expect, it } from "vitest";
import { lifePanelLayout, pageItems } from "./lifePanelLayout.js";

describe("life panel layout", () => {
  it("shows fewer actions on short phone screens", () => { expect(lifePanelLayout(568).pageSize).toBe(3); expect(lifePanelLayout(800).pageSize).toBe(4); });
  it("paginates and clamps page indexes", () => { expect(pageItems([1, 2, 3, 4, 5], 1, 3)).toEqual({ items: [4, 5], page: 1, pageCount: 2 }); expect(pageItems([1], 9, 3).page).toBe(0); });
});
