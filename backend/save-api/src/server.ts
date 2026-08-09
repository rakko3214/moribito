import { createServer } from "node:http";
import { InMemorySaveRepository } from "./repository/InMemorySaveRepository.js";
import { FileSaveRepository } from "./repository/FileSaveRepository.js";
import { SaveService } from "./service.js";
const repository = process.env.SAVE_DATA_PATH ? new FileSaveRepository(process.env.SAVE_DATA_PATH) : new InMemorySaveRepository();
const service = new SaveService(repository);
const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  const origin = request.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:5173)?$/.test(origin)) response.setHeader("access-control-allow-origin", origin);
  response.setHeader("access-control-allow-methods", "GET, PUT, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type, x-moribito-user");
  if (request.method === "OPTIONS") { response.statusCode = 204; return response.end(); }
  if (request.method === "GET" && request.url === "/health") return response.end(JSON.stringify({ status: "ok", storage: process.env.SAVE_DATA_PATH ? "file" : "memory" }));
  const userId = request.headers["x-moribito-user"]?.toString() ?? "local-user";
  if (request.method === "GET" && request.url === "/save") return response.end(JSON.stringify(await service.get(userId)));
  if (request.method === "POST" && request.url === "/save/reset") return response.end(JSON.stringify(await service.reset(userId)));
  if (request.method === "PUT" && request.url === "/save") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const input = JSON.parse(body) as { baseRevision?: number; saveData?: unknown };
    return response.end(JSON.stringify(await service.put(userId, input.baseRevision ?? 0, input.saveData)));
  }
  response.statusCode = 404;
  return response.end(JSON.stringify({ success: false, error: { code: "SAVE_NOT_FOUND", message: "Route not found." } }));
});
server.listen(3001, "0.0.0.0", () => console.log("Local save API: http://localhost:3001"));
