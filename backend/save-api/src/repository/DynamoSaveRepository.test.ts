import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it, vi } from "vitest";
import type { SaveDataV1 } from "@moribito/shared";
import { DynamoSaveRepository } from "./DynamoSaveRepository.js";

const save: SaveDataV1 = {
  version: 1, revision: 0, savedAt: new Date(0).toISOString(), player: { mapId: "map_village", x: 0, y: 0, direction: "down", money: 0, equippedToolId: null, equippedItemId: null }, world: { maps: {} }, time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] }, quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] }, progression: { chapter: 1, storyStep: "start", unlockedSystems: [], defeatedBosses: [] },
};

describe("DynamoSaveRepository", () => {
  it("allows revision zero after reset while preserving the user item", async () => {
    const send = vi.fn().mockResolvedValue({});
    const repository = new DynamoSaveRepository("saves", { send } as unknown as DynamoDBDocumentClient);
    await repository.put("user-1", 0, save);
    const command = send.mock.calls[0]?.[0] as { input: { ConditionExpression: string; ExpressionAttributeNames: Record<string, string> } };
    expect(command.input.ConditionExpression).toBe("attribute_not_exists(#current)");
    expect(command.input.ExpressionAttributeNames["#current"]).toBe("current");
  });

  it("maps conditional update failure to a revision conflict", async () => {
    const send = vi.fn().mockRejectedValue({ name: "ConditionalCheckFailedException" });
    const repository = new DynamoSaveRepository("saves", { send } as unknown as DynamoDBDocumentClient);
    await expect(repository.put("user-1", 1, { ...save, revision: 1 })).resolves.toBe("conflict");
  });
});
