import type { SaveDataV1 } from "../schema/save.js";

export type ReactToGameEvent =
  | { type: "START_NEW_GAME" }
  | { type: "LOAD_GAME"; payload: SaveDataV1 }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" };

export type GameToReactEvent =
  | { type: "GAME_READY" }
  | { type: "SAVE_REQUEST"; payload: SaveDataV1 }
  | { type: "OPEN_MENU" }
  | { type: "GAME_ERROR"; payload: { fatal: boolean; message: string } };

