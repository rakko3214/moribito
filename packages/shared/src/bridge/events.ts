import type { SaveDataV1 } from "../schema/save.js";

export type ReactToGameEvent =
  | { type: "START_NEW_GAME" }
  | { type: "LOAD_GAME"; payload: SaveDataV1 }
  | { type: "REQUEST_SAVE" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "SAVE_COMPLETED"; payload: { revision: number; savedAt: string } }
  | { type: "SAVE_FAILED"; payload: { message: string } };

export type GameToReactEvent =
  | { type: "GAME_READY" }
  | { type: "SAVE_REQUEST"; payload: SaveDataV1 }
  | { type: "SAVE_STATE_CHANGED"; payload: { status: "saved" | "saving" | "dirty" | "error" } }
  | { type: "OPEN_MENU" }
  | { type: "GAME_ERROR"; payload: { fatal: boolean; message: string } };
