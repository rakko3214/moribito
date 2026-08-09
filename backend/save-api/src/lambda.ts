import type { ApiErrorCode } from "@moribito/shared";
import { DynamoSaveRepository } from "./repository/DynamoSaveRepository.js";
import { SaveService } from "./service.js";

type LambdaEvent = { routeKey?: string; body?: string | null; requestContext?: { authorizer?: { jwt?: { claims?: Record<string, string> } } } };
type LambdaResponse = { statusCode: number; headers: Record<string, string>; body: string };

const statusForError: Record<ApiErrorCode, number> = { SAVE_NOT_FOUND: 404, SAVE_CONFLICT: 409, INVALID_SAVE: 400, UNSUPPORTED_SAVE_VERSION: 400, UNAUTHORIZED: 401, PAYLOAD_TOO_LARGE: 413, INTERNAL_ERROR: 500 };
const response = (statusCode: number, body: unknown): LambdaResponse => ({ statusCode, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, body: JSON.stringify(body) });

export function createHandler(service: SaveService) {
  return async (event: LambdaEvent): Promise<LambdaResponse> => {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) return response(401, { success: false, error: { code: "UNAUTHORIZED", message: "Authentication is required." } });
    try {
      if (event.routeKey === "GET /save") {
        const result = await service.get(userId);
        return response(result.success ? 200 : statusForError[result.error.code], result);
      }
      if (event.routeKey === "PUT /save") {
        if ((event.body?.length ?? 0) > 400_000) return response(413, { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Save payload is too large." } });
        let input: { baseRevision?: number; saveData?: unknown };
        try { input = JSON.parse(event.body ?? "") as typeof input; }
        catch { return response(400, { success: false, error: { code: "INVALID_SAVE", message: "Request body is not valid JSON." } }); }
        const result = await service.put(userId, input.baseRevision ?? -1, input.saveData);
        return response(result.success ? 200 : statusForError[result.error.code], result);
      }
      if (event.routeKey === "POST /save/reset") return response(200, await service.reset(userId));
      return response(404, { success: false, error: { code: "SAVE_NOT_FOUND", message: "Route not found." } });
    } catch {
      return response(500, { success: false, error: { code: "INTERNAL_ERROR", message: "An internal error occurred." } });
    }
  };
}

let productionHandler: ReturnType<typeof createHandler> | undefined;
export async function handler(event: LambdaEvent) {
  const tableName = process.env.SAVE_TABLE_NAME;
  if (!tableName) throw new Error("SAVE_TABLE_NAME is required.");
  productionHandler ??= createHandler(new SaveService(new DynamoSaveRepository(tableName)));
  return productionHandler(event);
}
