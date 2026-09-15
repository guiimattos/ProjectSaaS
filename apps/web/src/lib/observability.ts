export type AnalyticsEvent = {
  name: string;
  organizationId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
};

const POSTHOG_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";
const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Bridge de observabilidade: sem chaves configuradas, apenas loga.
 * Com POSTHOG_API_KEY envia eventos via HTTP (sem SDK pesado); com SENTRY_DSN usa a Store API.
 */
export function trackEvent(event: AnalyticsEvent) {
  if (process.env.NODE_ENV === "test") return;
  console.info("[analytics]", JSON.stringify(event));

  if (!POSTHOG_KEY) return;
  void fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: event.name,
      distinct_id: event.userId ?? event.organizationId ?? "anonymous",
      properties: { ...event.properties, organizationId: event.organizationId, $groups: event.organizationId ? { organization: event.organizationId } : undefined },
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("[error]", err.message, context ?? {});

  if (!SENTRY_DSN) return;
  try {
    const dsn = new URL(SENTRY_DSN);
    const projectId = dsn.pathname.replace("/", "");
    const endpoint = `${dsn.protocol}//${dsn.host}/api/${projectId}/store/`;
    void fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.username}, sentry_client=taskflow/1.0`,
      },
      body: JSON.stringify({
        message: err.message,
        level: "error",
        platform: "node",
        timestamp: Date.now() / 1000,
        exception: { values: [{ type: err.name, value: err.message, stacktrace: err.stack ? { frames: [{ filename: err.stack.split("\n")[1]?.trim() }] } : undefined }] },
        extra: context,
      }),
    }).catch(() => undefined);
  } catch {
    // DSN inválido: ignora silenciosamente
  }
}
