import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { GameRuntime } from "./GameRuntime.js";

describe("GameRuntime save loop", () => {
  it("creates, mutates and requests a validated save", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    let requestedRevision: number | undefined;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") requestedRevision = event.payload.revision; });
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.updatePlayer("map_village", 700, 640, "right");
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(requestedRevision).toBe(0);
    expect(runtime.getState().player).toMatchObject({ x: 700, y: 640, direction: "right" });
  });

  it("keeps dirty state when movement occurs during a save", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    const statuses: string[] = [];
    bridge.onReact((event) => { if (event.type === "SAVE_STATE_CHANGED") statuses.push(event.payload.status); });
    bridge.toGame({ type: "START_NEW_GAME" });
    bridge.toGame({ type: "REQUEST_SAVE" });
    runtime.updatePlayer("map_village", 680, 650, "right");
    bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision: 1, savedAt: new Date().toISOString() } });
    expect(statuses.at(-1)).toBe("dirty");
  });

  it("unsubscribes from the bridge when destroyed", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    let saveRequests = 0;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") saveRequests += 1; });
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.destroy();
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saveRequests).toBe(0);
  });
});
