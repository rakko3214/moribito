import { describe, expect, it } from "vitest";
import { API_VERSION, healthPayload, SAVE_SCHEMA_VERSION } from "./health.js";

describe("healthPayload", () => {
  it("reports the in-memory development backend", () => {
    expect(healthPayload()).toEqual({ status: "ok", storage: "memory", apiVersion: API_VERSION, schemaVersion: SAVE_SCHEMA_VERSION });
  });

  it("reports persistent file storage without exposing its path", () => {
    const result = healthPayload("C:/private/saves.json");
    expect(result.storage).toBe("file");
    expect(JSON.stringify(result)).not.toContain("private");
  });
});
