import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SaveDataV1 } from "@moribito/shared";
import { FileSaveRepository } from "./FileSaveRepository.js";

const temporaryDirectories: string[] = [];
const createSave = (): SaveDataV1 => ({
  version: 1, revision: 0, savedAt: new Date(0).toISOString(),
  player: { mapId: "map_village", x: 1, y: 2, direction: "down", money: 0, equippedToolId: null, equippedItemId: null },
  world: { maps: {} }, time: { year: 1, season: "spring", day: 1, minutes: 360 }, inventory: { items: [], storage: [] },
  quests: { active: [], completedIds: [] }, events: { flags: [], completedEventIds: [] }, npcs: { states: {} }, farming: { plots: [] },
  progression: { chapter: 1, storyStep: "start", unlockedSystems: [], defeatedBosses: [] },
});

afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe("FileSaveRepository", () => {
  it("persists data across repository instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "moribito-save-"));
    temporaryDirectories.push(directory);
    const file = join(directory, "saves.json");
    const first = new FileSaveRepository(file);
    const stored = await first.put("user-1", 0, createSave());
    expect(stored).not.toBe("conflict");
    const restored = await new FileSaveRepository(file).get("user-1");
    expect(restored).toMatchObject({ revision: 1, player: { mapId: "map_village", x: 1, y: 2 } });
  });

  it("rejects a stale revision", async () => {
    const directory = await mkdtemp(join(tmpdir(), "moribito-save-"));
    temporaryDirectories.push(directory);
    const repository = new FileSaveRepository(join(directory, "saves.json"));
    await repository.put("user-1", 0, createSave());
    expect(await repository.put("user-1", 0, createSave())).toBe("conflict");
  });
});
