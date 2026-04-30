import * as Sentry from "@sentry/browser";

let initialized = false;

export function initSentry() {
  if (initialized || typeof window === "undefined") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      if (event.exception?.values?.some((v) => v.type === "ChunkLoadError")) {
        return null;
      }
      return event;
    },
  });

  initialized = true;
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (context) {
    Sentry.setContext("app", context);
  }
  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    Sentry.captureMessage(String(error), "error");
  }
}
