import { saveDataV1Schema, type GetSaveResponse, type PutSaveResponse, type SaveDataV1 } from "@moribito/shared";

function apiBaseUrl() { return `${window.location.protocol}//${window.location.hostname}:3001`; }
const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

class NonRetryableSaveError extends Error {}

export async function withRetry<T>(operation: () => Promise<T>, delays = [1000, 2000, 4000], sleep: (milliseconds: number) => Promise<void> = wait): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (error instanceof NonRetryableSaveError) throw error;
      lastError = error;
      const delay = delays[attempt];
      if (delay === undefined) break;
      await sleep(delay);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Save request failed.");
}

export async function loadSave(): Promise<SaveDataV1 | null> {
  const response = await fetch(`${apiBaseUrl()}/save`);
  if (!response.ok) throw new Error(`Save load failed (${response.status}).`);
  const result = await response.json() as GetSaveResponse;
  if (!result.success) {
    if (result.error.code === "SAVE_NOT_FOUND") return null;
    throw new Error(result.error.message);
  }
  return saveDataV1Schema.parse(result.data);
}

export async function putSave(saveData: SaveDataV1) {
  return withRetry(async () => {
    const response = await fetch(`${apiBaseUrl()}/save`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ baseRevision: saveData.revision, saveData }),
    });
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) throw new NonRetryableSaveError(`Save failed (${response.status}).`);
      throw new Error(`Save failed (${response.status}).`);
    }
    const result = await response.json() as PutSaveResponse;
    if (!result.success) throw new NonRetryableSaveError(result.error.message);
    return result.data;
  });
}
