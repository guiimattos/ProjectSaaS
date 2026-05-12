export type AnalyticsEvent = {
  name: string;
  organizationId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
};

/**
 * Minimal observability bridge.
 * Can be swapped to PostHog/Sentry providers without touching routes.
 */
export function trackEvent(event: AnalyticsEvent) {
  if (process.env.NODE_ENV !== "test") {
    console.info("[analytics]", JSON.stringify(event));
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[error]", message, context ?? {});
}
