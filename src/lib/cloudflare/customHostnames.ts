/**
 * Cloudflare for SaaS — Custom Hostnames API.
 *
 * Lets a user connect their own domain (e.g. dannisandnaomi.com) to their site.
 * Cloudflare issues the TLS cert and routes the domain to our fallback origin
 * (fallback.dreamysuite.com), which the Worker serves. Requires the Worker's
 * CF_API_TOKEN to have Zone → SSL and Certificates: Edit on CF_ZONE_ID.
 */
import type { Env } from "@/app/lib/auth.server";

const CF_API = "https://api.cloudflare.com/client/v4";

export interface HostnameStatus {
  id: string;
  hostname: string;
  /** "pending" | "active" | "pending_deployment" | "blocked" | ... */
  status: string;
  /** SSL cert status: "pending_validation" | "active" | ... */
  sslStatus: string;
  verificationErrors: string[];
}

type CfResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

interface CfHostnameRaw {
  id: string;
  hostname: string;
  status?: string;
  ssl?: { status?: string; validation_errors?: { message: string }[] };
  verification_errors?: string[];
}

function normalize(r: CfHostnameRaw): HostnameStatus {
  return {
    id: r.id,
    hostname: r.hostname,
    status: r.status ?? "unknown",
    sslStatus: r.ssl?.status ?? "unknown",
    verificationErrors: [
      ...(r.verification_errors ?? []),
      ...(r.ssl?.validation_errors ?? []).map((e) => e.message),
    ].filter(Boolean),
  };
}

async function cf<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<CfResult<T>> {
  try {
    const res = await fetch(`${CF_API}/zones/${env.CF_ZONE_ID}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json()) as {
      success: boolean;
      result: T;
      errors?: { code: number; message: string }[];
    };
    if (!res.ok || !body.success) {
      const msg =
        body.errors?.map((e) => e.message).join("; ") ||
        `Cloudflare API error (${res.status})`;
      return { ok: false, error: msg, status: res.status };
    }
    return { ok: true, data: body.result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      status: 0,
    };
  }
}

/** Create (or return the existing) custom hostname for the domain. */
export async function createCustomHostname(
  env: Env,
  hostname: string,
): Promise<CfResult<HostnameStatus>> {
  // If it already exists (e.g. a retry), return it rather than erroring.
  const existing = await findCustomHostname(env, hostname);
  if (existing.ok && existing.data) return { ok: true, data: existing.data };

  const r = await cf<CfHostnameRaw>(env, "/custom_hostnames", {
    method: "POST",
    body: JSON.stringify({
      hostname,
      ssl: {
        method: "http",
        type: "dv",
        settings: { min_tls_version: "1.2" },
      },
    }),
  });
  return r.ok ? { ok: true, data: normalize(r.data) } : r;
}

/** Look up a custom hostname by its domain; null result if not present. */
export async function findCustomHostname(
  env: Env,
  hostname: string,
): Promise<CfResult<HostnameStatus | null>> {
  const r = await cf<CfHostnameRaw[]>(
    env,
    `/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
  );
  if (!r.ok) return r;
  const match = r.data.find((h) => h.hostname === hostname);
  return { ok: true, data: match ? normalize(match) : null };
}

export async function deleteCustomHostname(
  env: Env,
  id: string,
): Promise<CfResult<{ id: string }>> {
  return cf<{ id: string }>(env, `/custom_hostnames/${id}`, {
    method: "DELETE",
  });
}
