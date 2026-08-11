import { describe, expect, it } from "vitest";
import type { SaveDataV1 } from "@moribito/shared";
import { createHandler } from "./lambda.js";
import { InMemorySaveRepository } from "./repository/InMemorySaveRepository.js";
import { SaveService } from "./service.js";

const save: SaveDataV1 = {
  version: 1, revision: 0, savedAt: new Date(0).toISOString(),
  player: { mapId: "map_village", x: 1, y: 2, direction: "down", money: 0, equippedToolId: null, equippedItemId: null },
  world: { maps: {} }, time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] }, quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] }, progression: { chapter: 1, storyStep: "start", unlockedSystems: [], defeatedBosses: [] },
};
const authenticated = { requestContext: { authorizer: { jwt: { claims: { sub: "user-1" } } } } };

describe("save Lambda", () => {
  it("rejects a request without Cognito claims", async () => {
    const handler = createHandler(new SaveService(new InMemorySaveRepository()));
    expect((await handler({ routeKey: "GET /save" })).statusCode).toBe(401);
  });

  it("stores and retrieves a user-scoped save", async () => {
    const handler = createHandler(new SaveService(new InMemorySaveRepository()));
    const put = await handler({ ...authenticated, routeKey: "PUT /save", body: JSON.stringify({ baseRevision: 0, saveData: save }) });
    expect(put.statusCode).toBe(200);
    const get = await handler({ ...authenticated, routeKey: "GET /save" });
    expect(get.statusCode).toBe(200);
    expect(JSON.parse(get.body).data.revision).toBe(1);
  });

  it("resets an existing save before accepting a new game at revision zero", async () => {
    const handler = createHandler(new SaveService(new InMemorySaveRepository()));
    await handler({ ...authenticated, routeKey: "PUT /save", body: JSON.stringify({ baseRevision: 0, saveData: save }) });
    const reset = await handler({ ...authenticated, routeKey: "POST /save/reset" });
    expect(reset.statusCode).toBe(200);
    const fresh = await handler({ ...authenticated, routeKey: "PUT /save", body: JSON.stringify({ baseRevision: 0, saveData: save }) });
    expect(fresh.statusCode).toBe(200);
    expect(JSON.parse(fresh.body).data.revision).toBe(1);
  });
});
