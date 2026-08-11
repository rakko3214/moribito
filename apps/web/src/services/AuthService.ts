export type AuthSession = { userId: string; displayName: string; provider: "mock" | "google" };
type SessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const SESSION_KEY = "moribito.auth.session";

export class LocalMockAuthService {
  constructor(private readonly storage: SessionStorage) {}
  restoreSession(): AuthSession | null {
    const raw = this.storage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as Partial<AuthSession>;
      return value.userId && value.displayName && value.provider === "mock" ? { userId: value.userId, displayName: value.displayName, provider: "mock" } : null;
    } catch { return null; }
  }
  signIn(): AuthSession {
    const session: AuthSession = { userId: "local-user", displayName: "開発用プレイヤー", provider: "mock" };
    this.storage.setItem(SESSION_KEY, JSON.stringify(session)); return session;
  }
  signOut() { this.storage.removeItem(SESSION_KEY); }
}
