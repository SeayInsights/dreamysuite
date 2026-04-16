/**
 * Feature flags.
 *
 * Flags are driven by env vars so they work uniformly across server and client.
 * Use NEXT_PUBLIC_* prefix for client-exposed flags. Values are evaluated at
 * bundle time; restart the dev server after changing .env.local.
 */

function boolEnv(raw: string | undefined): boolean {
	if (!raw) return false;
	const v = raw.toLowerCase();
	return v === "1" || v === "true" || v === "yes" || v === "on";
}

export const flags = {
	editorV2: boolEnv(process.env.NEXT_PUBLIC_EDITOR_V2),
} as const;

export type FeatureFlags = typeof flags;
