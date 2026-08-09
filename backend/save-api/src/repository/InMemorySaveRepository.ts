import type { SaveDataV1 } from "@moribito/shared";
import type { SaveRepository } from "./SaveRepository.js";
export class InMemorySaveRepository implements SaveRepository {
  private readonly saves = new Map<string, SaveDataV1>();
  async get(userId: string) { return this.saves.get(userId) ?? null; }
  async put(userId: string, baseRevision: number, save: SaveDataV1) {
    const current = this.saves.get(userId);
    if ((current?.revision ?? 0) !== baseRevision) return "conflict" as const;
    const next = { ...save, revision: baseRevision + 1, savedAt: new Date().toISOString() };
    this.saves.set(userId, next);
    return next;
  }
  async reset(userId: string) { this.saves.delete(userId); }
}
