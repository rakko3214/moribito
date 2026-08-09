import type { SaveDataV1 } from "../schema/save.js";

export type ApiErrorCode =
  | "SAVE_NOT_FOUND"
  | "SAVE_CONFLICT"
  | "INVALID_SAVE"
  | "UNSUPPORTED_SAVE_VERSION"
  | "UNAUTHORIZED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { code: ApiErrorCode; message: string } };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type PutSaveRequest = { baseRevision: number; saveData: SaveDataV1 };
export type PutSaveResponse = ApiResult<{ revision: number; savedAt: string }>;
export type GetSaveResponse = ApiResult<SaveDataV1>;

