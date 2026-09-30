export type BrowserIssueSeverity = "error" | "warning";

export interface BrowserCapabilityEnvironment {
  width: number;
  height: number;
  online: boolean;
  maxTouchPoints: number;
  audioContext: boolean;
  vibration: boolean;
  localStorage: boolean;
  webgl: boolean;
}

export interface BrowserCapabilityIssue {
  severity: BrowserIssueSeverity;
  code: "storage" | "webgl" | "offline" | "landscape" | "audio" | "vibration";
  message: string;
}

export interface BrowserCapabilityResult {
  supported: boolean;
  orientation: "portrait" | "landscape";
  touch: boolean;
  features: Pick<BrowserCapabilityEnvironment, "online" | "audioContext" | "vibration" | "localStorage" | "webgl">;
  issues: BrowserCapabilityIssue[];
}

export function diagnoseBrowser(environment: BrowserCapabilityEnvironment): BrowserCapabilityResult {
  const orientation = environment.width > environment.height ? "landscape" : "portrait";
  const touch = environment.maxTouchPoints > 0;
  const issues: BrowserCapabilityIssue[] = [];

  if (!environment.localStorage) issues.push({ severity: "error", code: "storage", message: "端末内セーブを利用できません。ブラウザのサイトデータ設定を確認してください。" });
  if (!environment.webgl) issues.push({ severity: "error", code: "webgl", message: "WebGLを利用できないためゲーム画面を表示できません。対応ブラウザで開いてください。" });
  if (!environment.online) issues.push({ severity: "warning", code: "offline", message: "オフラインです。進行は端末へ保留されます。" });
  if (touch && orientation === "landscape") issues.push({ severity: "warning", code: "landscape", message: "操作しやすい縦画面を推奨します。" });
  if (!environment.audioContext) issues.push({ severity: "warning", code: "audio", message: "この端末ではゲーム音を再生できません。" });
  if (touch && !environment.vibration) issues.push({ severity: "warning", code: "vibration", message: "この端末では操作時の振動を利用できません。" });

  return { supported: !issues.some((issue) => issue.severity === "error"), orientation, touch,
    features: { online: environment.online, audioContext: environment.audioContext, vibration: environment.vibration, localStorage: environment.localStorage, webgl: environment.webgl }, issues };
}

export function shouldRetrySaveAfterReconnect(screen: string, saveStatus: string): boolean {
  return screen === "game" && (saveStatus === "dirty" || saveStatus === "error");
}

function canUseLocalStorage(storage: Storage): boolean {
  try { const key = "moribito.capability-check"; storage.setItem(key, "1"); storage.removeItem(key); return true; }
  catch { return false; }
}

function canUseWebGl(documentObject: Document): boolean {
  try { const canvas = documentObject.createElement("canvas"); return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")); }
  catch { return false; }
}

export function readBrowserCapabilityEnvironment(windowObject: Window, documentObject: Document): BrowserCapabilityEnvironment {
  const audioWindow = windowObject as Window & { webkitAudioContext?: unknown; AudioContext?: unknown };
  return { width: windowObject.innerWidth, height: windowObject.innerHeight, online: windowObject.navigator.onLine,
    maxTouchPoints: windowObject.navigator.maxTouchPoints ?? 0, audioContext: Boolean(audioWindow.AudioContext ?? audioWindow.webkitAudioContext),
    vibration: typeof windowObject.navigator.vibrate === "function", localStorage: canUseLocalStorage(windowObject.localStorage), webgl: canUseWebGl(documentObject) };
}
