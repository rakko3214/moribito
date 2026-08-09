import { saveDataV1Schema, type ApiResult, type SaveDataV1 } from "@moribito/shared";
import type { SaveRepository } from "./repository/SaveRepository.js";
export class SaveService {
  constructor(private readonly repository: SaveRepository) {}
  async get(userId: string): Promise<ApiResult<SaveDataV1>> {
    const save = await this.repository.get(userId);
    return save ? { success: true, data: save } : { success: false, error: { code: "SAVE_NOT_FOUND", message: "Save data was not found." } };
  }
  async put(userId: string, baseRevision: number, input: unknown): Promise<ApiResult<{ revision: number; savedAt: string }>> {
    const parsed = saveDataV1Schema.safeParse(input);
    if (!parsed.success) return { success: false, error: { code: "INVALID_SAVE", message: "Save data is invalid." } };
    const result = await this.repository.put(userId, baseRevision, parsed.data);
    if (result === "conflict") return { success: false, error: { code: "SAVE_CONFLICT", message: "A newer cloud save exists." } };
    return { success: true, data: { revision: result.revision, savedAt: result.savedAt } };
  }
  async reset(userId: string): Promise<ApiResult<null>> { await this.repository.reset(userId); return { success: true, data: null }; }
}
