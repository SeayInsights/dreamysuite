import { cache } from "react";
import { headers } from "next/headers";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";

/**
 * Cached session getter - prevents cookie double-encoding
 *
 * Next.js re-encodes cookies when headers() is called multiple times
 * in the same request (e.g., layout + page). This breaks better-auth's
 * cryptographic signatures.
 *
 * Using React cache() ensures headers() is only called ONCE per request,
 * even if multiple components call getAuthSession().
 */
export const getAuthSession = cache(async () => {
  const env = await getEnv();
  const auth = createAuth(env);
  const requestHeaders = await headers();
  return auth.api.getSession({ headers: requestHeaders });
});
