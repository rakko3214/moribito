import { z } from "zod";

const itemStackSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().nonnegative()
});

export const saveDataV1Schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  savedAt: z.iso.datetime(),
  player: z.object({
    mapId: z.string().min(1),
    x: z.number().finite(),
    y: z.number().finite(),
    direction: z.enum(["up", "down", "left", "right"]),
    money: z.number().int().nonnegative(),
    equippedToolId: z.string().min(1).nullable(),
    equippedItemId: z.string().min(1).nullable()
  }),
  world: z.object({
    maps: z.record(
      z.string(),
      z.object({
        collectedObjects: z.array(z.string()),
        openedChests: z.array(z.string()),
        destroyedObjects: z.array(z.string()),
        flags: z.array(z.string())
      })
    )
  }),
  time: z.object({
    year: z.number().int().positive(),
    season: z.string().min(1),
    day: z.number().int().positive(),
    minutes: z.number().int().min(0).max(1439)
  }),
  inventory: z.object({
    items: z.array(itemStackSchema),
    storage: z.array(itemStackSchema)
  }),
  quests: z.object({
    active: z.array(z.object({ id: z.string(), step: z.string(), value: z.number() })),
    completedIds: z.array(z.string())
  }),
  events: z.object({
    flags: z.array(z.string()),
    completedEventIds: z.array(z.string())
  }),
  npcs: z.object({
    states: z.record(
      z.string(),
      z.object({ friendship: z.number().optional(), flags: z.array(z.string()).optional() })
    )
  }),
  farming: z.object({
    plots: z.array(
      z.object({
        plotId: z.string(),
        cropId: z.string().nullable(),
        plantedDay: z.number().int().nullable(),
        growthStage: z.number().int().nonnegative(),
        wateredToday: z.boolean()
      })
    )
  }),
  progression: z.object({
    chapter: z.number().int().positive(),
    storyStep: z.string(),
    unlockedSystems: z.array(z.string()),
    defeatedBosses: z.array(z.string())
  })
});

export type SaveDataV1 = z.infer<typeof saveDataV1Schema>;

