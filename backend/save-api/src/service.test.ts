import { describe, expect, it } from "vitest";
import { InMemorySaveRepository } from "./repository/InMemorySaveRepository.js";
import { SaveService } from "./service.js";
describe("SaveService", () => {
  it("returns SAVE_NOT_FOUND for a new local user", async () => {
    const result = await new SaveService(new InMemorySaveRepository()).get("new-user");
    expect(result).toEqual({ success: false, error: { code: "SAVE_NOT_FOUND", message: "Save data was not found." } });
  });
});
