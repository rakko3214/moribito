export const PWA_UPDATE_EVENT = "moribito:pwa-update";

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function shouldRegisterServiceWorker(production: boolean, secureContext: boolean, hasServiceWorker: boolean): boolean {
  return production && secureContext && hasServiceWorker;
}

export function isStandaloneDisplay(matchesStandalone: boolean, iosStandalone = false): boolean {
  return matchesStandalone || iosStandalone;
}

export function shouldSaveBeforeAppUpdate(saveAlreadyCompleted: boolean, developerSession: boolean, saveStatus: string): boolean {
  return !saveAlreadyCompleted && !developerSession && saveStatus !== "saved";
}

export async function registerMoribitoServiceWorker(
  navigatorObject: Navigator,
  production: boolean,
  secureContext: boolean,
  dispatchUpdate: () => void,
): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterServiceWorker(production, secureContext, "serviceWorker" in navigatorObject)) return null;
  const registration = await navigatorObject.serviceWorker.register("/sw.js", { scope: "/" });
  if (registration.waiting) dispatchUpdate();
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigatorObject.serviceWorker.controller) dispatchUpdate();
    });
  });
  return registration;
}

export async function activateWaitingServiceWorker(navigatorObject: Navigator): Promise<boolean> {
  if (!("serviceWorker" in navigatorObject)) return false;
  const registration = await navigatorObject.serviceWorker.getRegistration();
  if (!registration?.waiting) return false;
  registration.waiting.postMessage("SKIP_WAITING");
  return true;
}

export function moribitoCacheNames(names: string[]): string[] {
  return names.filter((name) => name.startsWith("moribito-"));
}

export async function clearMoribitoAppCache(navigatorObject: Navigator, cacheStorage: CacheStorage): Promise<void> {
  const names = moribitoCacheNames(await cacheStorage.keys());
  await Promise.all(names.map((name) => cacheStorage.delete(name)));
  if ("serviceWorker" in navigatorObject) {
    const registrations = await navigatorObject.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((registration) => {
      const script = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
      return script && new URL(script).pathname === "/sw.js";
    }).map((registration) => registration.unregister()));
  }
}
