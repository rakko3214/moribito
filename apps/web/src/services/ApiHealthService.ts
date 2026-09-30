export type ApiHealthStatus = "checking" | "available" | "unavailable";
export type ApiHealthSnapshot = {
  status: ApiHealthStatus;
  latencyMs: number | null;
  storage: string | null;
  apiVersion: string | null;
  schemaVersion: number | null;
  checkedAt: string | null;
};

export const initialApiHealth: ApiHealthSnapshot = { status: "checking", latencyMs: null, storage: null, apiVersion: null, schemaVersion: null, checkedAt: null };

type HealthResponse = { status?: unknown; storage?: unknown; apiVersion?: unknown; schemaVersion?: unknown };

export async function checkApiHealth(
  url: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 2500,
  now: () => number = () => Date.now(),
): Promise<ApiHealthSnapshot> {
  const startedAt = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${url}/health`, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Health check failed (${response.status})`);
    const body = await response.json() as HealthResponse;
    if (body.status !== "ok") throw new Error("Health response was invalid");
    return {
      status: "available", latencyMs: Math.max(0, now() - startedAt), storage: typeof body.storage === "string" ? body.storage : null,
      apiVersion: typeof body.apiVersion === "string" ? body.apiVersion : null, schemaVersion: typeof body.schemaVersion === "number" ? body.schemaVersion : null,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return { status: "unavailable", latencyMs: null, storage: null, apiVersion: null, schemaVersion: null, checkedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}
