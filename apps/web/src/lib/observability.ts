type AnalyticsEvent = {
  name: string;
  organizationId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
};

function shouldUsePosthog() {
  return Boolean(process.env.POSTHOG_API_KEY && process.env.POSTHOG_HOST);
}

async function sendToPosthog(event: AnalyticsEvent) {
  if (!shouldUsePosthog()) return;

  await fetch(`${process.env.POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.POSTHOG_API_KEY,
      event: event.name,
      distinct_id: event.userId ?? event.organizationId ?? "anonymous",
      properties: {
        organizationId: event.organizationId,
        ...event.properties,
      },
    }),
  });
}

export function trackEvent(event: AnalyticsEvent) {
  if (process.env.NODE_ENV !== "test") {
    console.info("[analytics]", JSON.stringify(event));
  }

  void sendToPosthog(event).catch((error) => {
    console.error("[analytics:posthog:error]", error instanceof Error ? error.message : String(error));
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[error]", message, context ?? {});

  // Lightweight hook for Sentry-compatible DSN setup later.
  if (process.env.SENTRY_DSN) {
    console.error("[sentry:pending-integration]", JSON.stringify({ message, context }));
  }
}
