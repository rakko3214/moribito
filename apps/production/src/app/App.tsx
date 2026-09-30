import { useEffect, useMemo, useRef, useState } from "react";
import { SAVE_KEY, type SaveSnapshot } from "../domain/save.js";
import type { Direction, WorldHandle } from "../game/mountWorld.js";
import { DeviceSave } from "../persistence/DeviceSave.js";

type Screen = "loading" | "title" | "playing";
const directionLabels = { up: "上", left: "左", down: "下", right: "右" } as const;
const directionArrows = { up: "↑", left: "←", down: "↓", right: "→" } as const;

export function App() {
  const store = useMemo(() => new DeviceSave(window.localStorage, navigator.locks), []);
  const worldHost = useRef<HTMLDivElement>(null);
  const world = useRef<WorldHandle | null>(null);
  const current = useRef<SaveSnapshot | null>(null);
  const movementVersion = useRef(0);
  const saving = useRef<Promise<boolean> | null>(null);
  const [screen, setScreen] = useState<Screen>("loading");
  const [saved, setSaved] = useState<SaveSnapshot | null>(null);
  const [hasExistingSave, setHasExistingSave] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loaded = store.load();
      setSaved(loaded);
      setHasExistingSave(loaded !== null);
    } catch (cause) {
      setHasExistingSave(window.localStorage.getItem(SAVE_KEY) !== null);
      setError(message(cause));
    }
    setScreen("title");
  }, [store]);

  useEffect(() => {
    if (screen !== "playing" || !worldHost.current || !current.current) return;
    let disposed = false;
    setGameReady(false);
    const host = worldHost.current;
    const position = current.current.state.player;
    void import("../game/mountWorld.js").then(({ mountWorld }) => {
      if (disposed) return;
      world.current = mountWorld(host, position, () => {
        movementVersion.current += 1;
        setDirty(true);
      });
      setGameReady(true);
    }).catch((cause: unknown) => setError(`フィールドを開始できません: ${message(cause)}`));
    return () => {
      disposed = true;
      world.current?.destroy();
      world.current = null;
    };
  }, [screen]);

  const enterGame = (snapshot: SaveSnapshot) => {
    current.current = snapshot;
    movementVersion.current = 0;
    setDirty(false);
    setError(null);
    setConfirmNew(false);
    setScreen("playing");
  };

  const startNew = async () => {
    if (hasExistingSave && !confirmNew) { setConfirmNew(true); return; }
    setBusy(true);
    setError(null);
    try {
      const snapshot = await store.startNew();
      setSaved(snapshot);
      setHasExistingSave(true);
      enterGame(snapshot);
    } catch (cause) { setError(`新しい旅を保存できません: ${message(cause)}`); }
    finally { setBusy(false); }
  };

  const saveGame = (): Promise<boolean> => {
    if (saving.current) return saving.current;
    if (!current.current || !world.current) return Promise.resolve(false);
    const version = movementVersion.current;
    const position = world.current.getPlayer();
    setBusy(true);
    setError(null);
    const task = store.save(current.current, position)
      .then((snapshot) => {
        current.current = snapshot;
        setSaved(snapshot);
        if (movementVersion.current === version) setDirty(false);
        return true;
      })
      .catch((cause: unknown) => { setError(`保存できません: ${message(cause)}`); return false; })
      .finally(() => { saving.current = null; setBusy(false); });
    saving.current = task;
    return task;
  };

  useEffect(() => {
    if (screen !== "playing") return;
    const timer = window.setInterval(() => { if (dirty && !saving.current) void saveGame(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [dirty, screen]);

  const returnToTitle = async () => {
    world.current?.setEnabled(false);
    if (!dirty || await saveGame()) setScreen("title");
    else world.current?.setEnabled(true);
  };

  const pressDirection = (direction: Direction, pressed: boolean) => world.current?.setTouchDirection(direction, pressed);

  return (
    <main className={`app-shell ${screen === "playing" ? "is-playing" : ""}`}>
      {screen !== "playing" && <><div className="ambient ambient-left" aria-hidden="true" /><div className="ambient ambient-right" aria-hidden="true" /></>}

      {screen === "title" && <section className="title-panel" aria-labelledby="game-title">
        <p className="eyebrow">村と妖怪を結ぶ物語</p>
        <h1 id="game-title">結師</h1>
        <p className="subtitle">山あいの村から、もう一度。</p>
        <div className="title-actions">
          {saved && <button type="button" onClick={() => enterGame(saved)} disabled={busy}>続きから</button>}
          <button type="button" className="secondary" onClick={() => void startNew()} disabled={busy}>{confirmNew ? "保存を置き換えて始める" : "新しい旅"}</button>
          {confirmNew && <button type="button" className="quiet" onClick={() => setConfirmNew(false)}>戻る</button>}
        </div>
        {saved && <p className="save-summary">1年目・{saved.state.world.day}日目から再開</p>}
        {confirmNew && <p className="warning">現在の保存は置き換わります。</p>}
      </section>}

      {screen === "playing" && <section className="play-layout" aria-label="祖父の家の敷地">
        <header className="play-header">
          <div><p className="eyebrow">第一章</p><h1>祖父の家の敷地</h1></div>
          <div className="play-actions"><span className="save-indicator">{busy ? "保存中…" : dirty ? "未保存" : "保存済み"}</span><button type="button" onClick={() => void saveGame()} disabled={busy || !gameReady || !dirty}>保存</button><button type="button" onClick={() => void returnToTitle()} disabled={busy || !gameReady}>タイトルへ</button></div>
        </header>
        <div className="world-frame" ref={worldHost} aria-label="移動できるフィールド" />
        <div className="play-footer">
          <p>画面をなぞるか、方向キー・WASDで移動</p>
          <div className="direction-pad" aria-label="移動操作">
            {(["up", "left", "down", "right"] as const).map((direction) => <button key={direction} type="button" className={`direction-${direction}`} aria-label={`${directionLabels[direction]}へ移動`} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pressDirection(direction, true); }} onPointerUp={() => pressDirection(direction, false)} onPointerCancel={() => pressDirection(direction, false)} onPointerLeave={() => pressDirection(direction, false)}>{directionArrows[direction]}</button>)}
          </div>
        </div>
      </section>}

      {screen === "loading" && <p role="status">読み込み中…</p>}
      {error && <div className="error-banner" role="alert">{error}</div>}
    </main>
  );
}

function message(cause: unknown): string { return cause instanceof Error ? cause.message : "原因を確認してください。"; }
