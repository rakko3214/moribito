import { describe, expect, it } from "vitest";
import { LocalMockAuthService } from "./AuthService.js";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe("LocalMockAuthService", () => {
  it("persists and restores the development session", () => {
    const store = storage(); const auth = new LocalMockAuthService(store); expect(auth.restoreSession()).toBeNull();
    expect(auth.signIn().userId).toBe("local-user"); expect(new LocalMockAuthService(store).restoreSession()?.displayName).toBe("開発用プレイヤー");
    auth.signOut(); expect(auth.restoreSession()).toBeNull();
  });
  it("rejects malformed stored sessions", () => {
    const store = storage(); store.setItem("moribito.auth.session", "not-json"); expect(new LocalMockAuthService(store).restoreSession()).toBeNull();
  });
});
