/**
 * Feature flags.
 *
 * Flags are driven by env vars so they work uniformly across server and client.
 * Use NEXT_PUBLIC_* prefix for client-exposed flags. Values are evaluated at
 * bundle time; restart the dev server after changing .env.local.
 */

export const flags = {} as const;

export type FeatureFlags = typeof flags;
