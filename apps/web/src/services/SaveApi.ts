import { saveDataV1Schema, type GetSaveResponse, type PutSaveResponse, type SaveDataV1 } from "@moribito/shared";

function apiBaseUrl() { return `${window.location.protocol}//${window.location.hostname}:3001`; }

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
  const response = await fetch(`${apiBaseUrl()}/save`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ baseRevision: saveData.revision, saveData }),
  });
  if (!response.ok) throw new Error(`Save failed (${response.status}).`);
  const result = await response.json() as PutSaveResponse;
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}
