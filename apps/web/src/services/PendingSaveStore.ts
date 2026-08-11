import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";

export type PendingSave = {
  userId: string;
  baseRevision: number;
  saveData: SaveDataV1;
  createdAt: string;
};

export interface PendingSaveDriver {
  get(userId: string): Promise<unknown | undefined>;
  put(value: PendingSave): Promise<void>;
  delete(userId: string): Promise<void>;
}

export class PendingSaveStore {
  constructor(private readonly driver: PendingSaveDriver) {}

  async load(userId: string): Promise<PendingSave | null> {
    const value = await this.driver.get(userId);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<PendingSave>;
    if (candidate.userId !== userId || typeof candidate.baseRevision !== "number" || typeof candidate.createdAt !== "string") return null;
    const parsed = saveDataV1Schema.safeParse(candidate.saveData);
    return parsed.success ? { userId, baseRevision: candidate.baseRevision, createdAt: candidate.createdAt, saveData: parsed.data } : null;
  }

  save(userId: string, saveData: SaveDataV1) {
    return this.driver.put({ userId, baseRevision: saveData.revision, saveData: saveDataV1Schema.parse(structuredClone(saveData)), createdAt: new Date().toISOString() });
  }

  clear(userId: string) { return this.driver.delete(userId); }
}

const DATABASE_NAME = "moribito-pending-saves";
const STORE_NAME = "pending";

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

async function openDatabase() {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
  };
  return requestResult(request);
}

class IndexedDbPendingSaveDriver implements PendingSaveDriver {
  private async store(mode: IDBTransactionMode) {
    const database = await openDatabase();
    return { database, store: database.transaction(STORE_NAME, mode).objectStore(STORE_NAME) };
  }
  async get(userId: string) {
    const { database, store } = await this.store("readonly");
    try { return await requestResult(store.get(userId)); } finally { database.close(); }
  }
  async put(value: PendingSave) {
    const { database, store } = await this.store("readwrite");
    try { await requestResult(store.put(value)); } finally { database.close(); }
  }
  async delete(userId: string) {
    const { database, store } = await this.store("readwrite");
    try { await requestResult(store.delete(userId)); } finally { database.close(); }
  }
}

export const pendingSaveStore = new PendingSaveStore(new IndexedDbPendingSaveDriver());
