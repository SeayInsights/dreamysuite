import { createAuth } from "~/lib/auth.server";
import type { AppLoadContext } from "react-router";
import "~/lib/context";

interface RouteArgs {
  request: Request;
  context: AppLoadContext;
  params: { id: string };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Route {
  export type LoaderArgs = RouteArgs;
  export type ActionArgs = RouteArgs;
}

async function requireSiteOwnership(
  request: Request,
  context: Route.LoaderArgs["context"],
  siteId: string
) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const site = await context.cloudflare.env.DB
    .prepare("SELECT id, name FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string; name: string }>();
  if (!site) {
    return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
  }
  return { userId: session.user.id, userName: session.user.name ?? session.user.email, siteName: site.name };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// GET /api/sites/:id/invites — list all invites for this site
export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const result = await context.cloudflare.env.DB
    .prepare("SELECT id, email, invitedBy, createdAt FROM site_invite WHERE siteId = ? ORDER BY createdAt DESC")
    .bind(siteId)
    .all<{ id: string; email: string; invitedBy: string; createdAt: number }>();

  return jsonResponse({ invites: result.results });
}

// POST /api/sites/:id/invites — send an invite email and record it
export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const body = await request.json<{ email?: string }>();
  const email = body.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Valid email required" } }, 400);
  }

  // Prevent duplicate invites
  const existing = await context.cloudflare.env.DB
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, email)
    .first<{ id: string }>();
  if (existing) {
    return jsonResponse({ error: { code: "CONFLICT", message: "This email has already been invited" } }, 409);
  }

  const appUrl = context.cloudflare.env.APP_URL ?? "https://dreamysuite.com";
  const editorUrl = `${appUrl}/sites/${siteId}`;

  // Send via Resend
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${context.cloudflare.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DreamySuite <hello@mail.dreamysuite.com>",
      to: [email],
      subject: `You've been invited to collaborate on ${check.siteName}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#1a1714;">
          <h2 style="font-size:1.25rem;font-weight:600;margin:0 0 0.75rem;">You've been invited to collaborate</h2>
          <p style="color:#6b5e56;margin:0 0 1.25rem;line-height:1.6;">
            <strong>${check.userName}</strong> has invited you to help edit
            <strong>${check.siteName}</strong> on DreamySuite.
          </p>
          <a href="${editorUrl}" style="display:inline-block;background:#1c1710;color:#fdfbf7;padding:0.65rem 1.25rem;border-radius:8px;text-decoration:none;font-weight:500;font-size:0.9rem;">
            Open the Editor
          </a>
          <p style="margin:1.5rem 0 0;font-size:0.78rem;color:#b0a99f;line-height:1.5;">
            You'll need a DreamySuite account to edit. If you don't have one yet,
            you can sign up for free at <a href="${appUrl}" style="color:#b8921a;">${appUrl}</a>.
          </p>
        </div>
      `,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error("Resend error:", err);
    return jsonResponse({ error: { code: "EMAIL_FAILED", message: "Failed to send invite email" } }, 502);
  }

  // Record the invite
  const id = crypto.randomUUID();
  await context.cloudflare.env.DB
    .prepare("INSERT INTO site_invite (id, siteId, email, invitedBy, createdAt) VALUES (?, ?, ?, ?, ?)")
    .bind(id, siteId, email, check.userName, Date.now())
    .run();

  return jsonResponse({ invite: { id, email, invitedBy: check.userName, createdAt: Date.now() } }, 201);
}
