import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";
import type { SaveRepository } from "./SaveRepository.js";

type SaveStore = { current: Record<string, SaveDataV1>; previous: Record<string, SaveDataV1> };
const EMPTY_STORE: SaveStore = { current: {}, previous: {} };

export class FileSaveRepository implements SaveRepository {
  private operation: Promise<void> = Promise.resolve();
  constructor(private readonly filePath: string) {}

  get(userId: string) { return this.exclusive(async () => (await this.read()).current[userId] ?? null); }
  put(userId: string, baseRevision: number, save: SaveDataV1) {
    return this.exclusive(async () => {
      const store = await this.read();
      const current = store.current[userId];
      if ((current?.revision ?? 0) !== baseRevision) return "conflict" as const;
      const next = { ...save, revision: baseRevision + 1, savedAt: new Date().toISOString() };
      if (current) store.previous[userId] = current;
      store.current[userId] = next;
      await this.write(store);
      return next;
    });
  }
  reset(userId: string) {
    return this.exclusive(async () => {
      const store = await this.read();
      const current = store.current[userId];
      if (current) store.previous[userId] = current;
      delete store.current[userId];
      await this.write(store);
    });
  }
  private exclusive<T>(work: () => Promise<T>) {
    const result = this.operation.then(work, work);
    this.operation = result.then(() => undefined, () => undefined);
    return result;
  }
  private async read(): Promise<SaveStore> {
    try {
      const raw = JSON.parse(await readFile(this.filePath, "utf8")) as Partial<SaveStore>;
      const validate = (entries: Record<string, unknown> | undefined) => Object.fromEntries(Object.entries(entries ?? {}).map(([id, save]) => [id, saveDataV1Schema.parse(save)]));
      return { current: validate(raw.current), previous: validate(raw.previous) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY_STORE);
      throw error;
    }
  }
  private async write(store: SaveStore) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(store), "utf8");
    await rename(temporaryPath, this.filePath);
  }
}
