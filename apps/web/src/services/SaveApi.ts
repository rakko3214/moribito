import { saveDataV1Schema, type GetSaveResponse, type PutSaveResponse, type SaveDataV1 } from "@moribito/shared";
import { pendingSaveStore, type PendingSaveStore } from "./PendingSaveStore.js";
import { LocalSaveCache } from "./LocalSaveCache.js";

export function saveApiBaseUrl() { return `${window.location.protocol}//${window.location.hostname}:3001`; }
let saveUserId = "local-user";
export function setSaveUserId(userId: string) { saveUserId = userId; }
function authHeaders() { return { "x-moribito-user": saveUserId }; }
function saveCache() { return new LocalSaveCache(window.localStorage); }
const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export type SaveFailureKind = "conflict" | "rejected";
export class SaveRequestError extends Error {
  constructor(message: string, readonly kind: SaveFailureKind) { super(message); this.name = "SaveRequestError"; }
}

export async function withRetry<T>(operation: () => Promise<T>, delays = [1000, 2000, 4000], sleep: (milliseconds: number) => Promise<void> = wait): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (error instanceof SaveRequestError) throw error;
      lastError = error;
      const delay = delays[attempt];
      if (delay === undefined) break;
      await sleep(delay);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Save request failed.");
}

export type LoadSaveResult = { save: SaveDataV1 | null; pendingConflict: boolean; cloudUnavailable?: boolean };

function cachedSaveOrConnectionError(cause: unknown): LoadSaveResult {
  const cached = saveCache().load(saveUserId);
  if (cached) return { save: cached, pendingConflict: false, cloudUnavailable: true };
  throw new Error("クラウドセーブへ接続できません。通信またはAPIの起動状態を確認してください。", { cause });
}

export async function loadSave(): Promise<LoadSaveResult> {
  let response: Response;
  try {
    response = await fetch(`${saveApiBaseUrl()}/save`, { headers: authHeaders() });
  } catch (error) {
    return cachedSaveOrConnectionError(error);
  }
  if (!response.ok) {
    if (response.status >= 500) return cachedSaveOrConnectionError(new Error(`Save load failed (${response.status}).`));
    throw new Error(`Save load failed (${response.status}).`);
  }
  const result = await response.json() as GetSaveResponse;
  if (!result.success) {
    if (result.error.code === "SAVE_NOT_FOUND") {
      try { return await recoverPendingSave(null, saveUserId); }
      catch (error) { return cachedSaveOrConnectionError(error); }
    }
    throw new Error(result.error.message);
  }
  const cloudSave = saveDataV1Schema.parse(result.data);
  try {
    const recovered = await recoverPendingSave(cloudSave, saveUserId);
    if (recovered.save) saveCache().save(saveUserId, recovered.save);
    return recovered;
  } catch (error) {
    return cachedSaveOrConnectionError(error);
  }
}

async function sendSave(saveData: SaveDataV1) {
  return withRetry(async () => {
    const response = await fetch(`${saveApiBaseUrl()}/save`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ baseRevision: saveData.revision, saveData }),
    });
    if (!response.ok) {
      if (response.status === 409) throw new SaveRequestError("A newer cloud save exists.", "conflict");
      if (response.status >= 400 && response.status < 500) throw new SaveRequestError(`Save failed (${response.status}).`, "rejected");
      throw new Error(`Save failed (${response.status}).`);
    }
    const result = await response.json() as PutSaveResponse;
    if (!result.success) throw new SaveRequestError(result.error.message, result.error.code === "SAVE_CONFLICT" ? "conflict" : "rejected");
    return result.data;
  });
}

export async function recoverPendingSave(
  cloudSave: SaveDataV1 | null,
  userId: string,
  store: Pick<PendingSaveStore, "load" | "clear"> = pendingSaveStore,
  upload: (saveData: SaveDataV1) => Promise<{ revision: number; savedAt: string }> = sendSave,
) {
  const pending = await store.load(userId);
  if (!pending) return { save: cloudSave, pendingConflict: false };
  if (pending.baseRevision !== (cloudSave?.revision ?? 0)) return { save: cloudSave, pendingConflict: true };
  const saved = await upload(pending.saveData);
  await store.clear(userId);
  return { save: saveDataV1Schema.parse({ ...pending.saveData, revision: saved.revision, savedAt: saved.savedAt }), pendingConflict: false };
}

export async function putSave(saveData: SaveDataV1) {
  try {
    const result = await sendSave(saveData);
    await pendingSaveStore.clear(saveUserId);
    saveCache().save(saveUserId, { ...saveData, revision: result.revision, savedAt: result.savedAt });
    return result;
  } catch (error) {
    if (!(error instanceof SaveRequestError)) {
      saveCache().save(saveUserId, saveData);
      await pendingSaveStore.save(saveUserId, saveData);
    }
    throw error;
  }
}

export function discardPendingSave(userId = saveUserId, store: Pick<PendingSaveStore, "clear"> = pendingSaveStore) {
  return store.clear(userId);
}

export async function resetSave() {
  await withRetry(async () => {
    const response = await fetch(`${saveApiBaseUrl()}/save/reset`, { method: "POST", headers: authHeaders() });
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) throw new SaveRequestError(`Save reset failed (${response.status}).`, "rejected");
      throw new Error(`Save reset failed (${response.status}).`);
    }
    const result = await response.json() as { success: boolean; error?: { message: string } };
    if (!result.success) throw new SaveRequestError(result.error?.message ?? "Save reset failed.", "rejected");
  });
  await pendingSaveStore.clear(saveUserId);
  saveCache().clear(saveUserId);
}
