export const API_VERSION = "0.1.0";
export const SAVE_SCHEMA_VERSION = 1;

export function healthPayload(saveDataPath?: string) {
  return {
    status: "ok" as const,
    storage: saveDataPath ? "file" as const : "memory" as const,
    apiVersion: API_VERSION,
    schemaVersion: SAVE_SCHEMA_VERSION,
  };
}
