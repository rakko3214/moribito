import { z } from "zod";

export const SAVE_KEY = "moribito.production.save.v1";
export const MAP_ID = "homestead" as const;

export const saveSchema = z.strictObject({
  formatVersion: z.literal(1),
  saveId: z.uuid(),
  revision: z.number().int().nonnegative(),
  savedAt: z.iso.datetime(),
  state: z.strictObject({
    player: z.strictObject({
      mapId: z.literal(MAP_ID),
      x: z.number().finite().min(0).max(800),
      y: z.number().finite().min(0).max(640),
      facing: z.enum(["up", "down", "left", "right"]),
    }),
    world: z.strictObject({
      day: z.number().int().positive(),
      minutes: z.number().int().min(0).max(1439),
    }),
    progression: z.strictObject({
      chapter: z.literal(1),
      stepId: z.literal("prologue_start"),
    }),
  }),
});

export type SaveSnapshot = z.infer<typeof saveSchema>;
export type PlayerPosition = SaveSnapshot["state"]["player"];

export function createNewSnapshot(saveId: string, savedAt = new Date().toISOString()): SaveSnapshot {
  return saveSchema.parse({
    formatVersion: 1,
    saveId,
    revision: 0,
    savedAt,
    state: {
      player: { mapId: MAP_ID, x: 400, y: 360, facing: "down" },
      world: { day: 1, minutes: 6 * 60 },
      progression: { chapter: 1, stepId: "prologue_start" },
    },
  });
}
