import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { z } from "zod";
import { requireSiteOwner, apiOwnershipError, parseJsonBody } from "@/lib/api/site-auth";

const InviteCreateSchema = z.object({
  email: z.string().email().max(254),
});

const InviteDeleteSchema = z.object({
  inviteId: z.string().min(1),
});

// GET /api/sites/:id/invites — list all invites for this site
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwner(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const result = await env.DB
    .prepare("SELECT id, email, invitedBy, createdAt FROM site_invite WHERE siteId = ? ORDER BY createdAt DESC")
    .bind(siteId)
    .all<{ id: string; email: string; invitedBy: string; createdAt: number }>();

  return NextResponse.json({ invites: result.results });
}

// POST /api/sites/:id/invites — send an invite email and record it
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwner(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<unknown>(req);
  if ("error" in parsed) return parsed.error;

  const result = InviteCreateSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: result.error.issues[0]?.message ?? "Valid email required" } },
      { status: 400 },
    );
  }

  const email = result.data.email.trim().toLowerCase();

  // Prevent duplicate invites
  const existing = await env.DB
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, email)
    .first<{ id: string }>();
  if (existing) {
    return NextResponse.json({ error: { code: "CONFLICT", message: "This email has already been invited" } }, { status: 409 });
  }

  const appUrl = env.APP_URL ?? "https://dreamysuite.com";
  const editorUrl = `${appUrl}/sites/${siteId}`;

  // Record the invite first — email can be retried if it fails
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await env.DB
    .prepare("INSERT INTO site_invite (id, siteId, email, invitedBy, createdAt) VALUES (?, ?, ?, ?, ?)")
    .bind(id, siteId, email, check.userId, createdAt)
    .run();

  // Send via Resend
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
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
    console.error("Resend error: status", resendRes.status);
  }

  return NextResponse.json({ invite: { id, email, invitedBy: check.userId, createdAt } }, { status: 201 });
}

// DELETE /api/sites/:id/invites — remove an invite by id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwner(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsedDel = await parseJsonBody<unknown>(req);
  if ("error" in parsedDel) return parsedDel.error;

  const delResult = InviteDeleteSchema.safeParse(parsedDel.body);
  if (!delResult.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "inviteId required" } }, { status: 400 });
  }

  const { inviteId } = delResult.data;

  await env.DB
    .prepare("DELETE FROM site_invite WHERE id = ? AND siteId = ?")
    .bind(inviteId, siteId)
    .run();

  return NextResponse.json({ success: true });
}
