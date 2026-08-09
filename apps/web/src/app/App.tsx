import { useEffect, useRef, useState } from "react";
import { GameBridge } from "../game/bridge/GameBridge.js";
import { createGame } from "../game/createGame.js";
import { loadSave, putSave } from "../services/SaveApi.js";

type SaveStatus = "loading" | "saved" | "saving" | "dirty" | "error";
const statusText: Record<SaveStatus, string> = { loading: "読込中…", saved: "保存済み", saving: "保存中…", dirty: "未保存", error: "保存失敗" };

export function App() {
  const gameHost = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  if (!bridgeRef.current) bridgeRef.current = new GameBridge();
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");

  useEffect(() => {
    if (!gameHost.current || !bridgeRef.current) return;
    const bridge = bridgeRef.current;
    const unsubscribe = bridge.onReact((event) => {
      if (event.type === "GAME_READY") {
        setReady(true);
        void loadSave().then((save) => bridge.toGame(save ? { type: "LOAD_GAME", payload: save } : { type: "START_NEW_GAME" })).catch((error: unknown) => {
          setSaveStatus("error");
          bridge.toReact({ type: "GAME_ERROR", payload: { fatal: false, message: error instanceof Error ? error.message : "Save load failed." } });
          bridge.toGame({ type: "START_NEW_GAME" });
        });
      }
      if (event.type === "SAVE_STATE_CHANGED") setSaveStatus(event.payload.status);
      if (event.type === "SAVE_REQUEST") {
        void putSave(event.payload)
          .then((result) => bridge.toGame({ type: "SAVE_COMPLETED", payload: result }))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Save failed.";
            console.error("Save failed:", message);
            bridge.toGame({ type: "SAVE_FAILED", payload: { message } });
          });
      }
    });
    const game = createGame(gameHost.current, bridge);
    return () => { unsubscribe(); game.destroy(true); };
  }, []);

  return <main className="app-shell">
    <header className="app-header">
      <div><span className="eyebrow">FIRST PLAYABLE · PHASE 2</span><h1>結師</h1></div>
      <div className="header-actions">
        <span className={`save-status ${saveStatus}`}>{statusText[saveStatus]}</span>
        <button type="button" disabled={!ready || saveStatus === "saving" || saveStatus === "loading"} onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>セーブ</button>
        <span className={ready ? "status ready" : "status"}>{ready ? "GAME READY" : "起動中…"}</span>
      </div>
    </header>
    <section className="game-frame" aria-label="Moribito game canvas"><div ref={gameHost} className="game-host" /></section>
    <footer>GameRuntime · GameState · SaveMapper · Local Save API</footer>
  </main>;
}
