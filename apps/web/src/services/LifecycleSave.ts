export type LifecycleScreen = "auth" | "loading" | "title" | "game" | "menu";
type EventTargetLike = { addEventListener(type: string, listener: EventListener): void; removeEventListener(type: string, listener: EventListener): void };
type VisibilityTarget = EventTargetLike & { visibilityState: string };

export function bindLifecycleSave(
  documentTarget: VisibilityTarget,
  windowTarget: EventTargetLike,
  getScreen: () => LifecycleScreen,
  requestSave: () => void,
) {
  const requestDuringPlay = () => {
    const screen = getScreen();
    if (screen === "game" || screen === "menu") requestSave();
  };
  const onVisibilityChange: EventListener = () => {
    if (documentTarget.visibilityState === "hidden") requestDuringPlay();
  };
  const onPageHide: EventListener = () => requestDuringPlay();
  documentTarget.addEventListener("visibilitychange", onVisibilityChange);
  windowTarget.addEventListener("pagehide", onPageHide);
  return () => {
    documentTarget.removeEventListener("visibilitychange", onVisibilityChange);
    windowTarget.removeEventListener("pagehide", onPageHide);
  };
}
