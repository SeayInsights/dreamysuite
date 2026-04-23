import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { flags } from "@/lib/flags";
import { SiteEditor } from "./editor";
import { SiteEditorV2 } from "./editor-v2";

interface Site {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  eventType: string | null;
  status: string;
  previewColor: string;
  updatedAt: number;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Editor — ${id} — DreamySuite` };
}

export default async function SiteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = await getEnv();

  const auth = createAuth(env);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  console.log('[site page] session check:', {
    siteId: id,
    hasSession: !!session,
    userId: session?.user?.id,
    cookies: requestHeaders.get('cookie')?.split(';').filter(c => c.includes('auth')).join('; ') || 'no auth cookies'
  });

  if (!session) {
    console.log('[site page] no session, redirecting to login');
    redirect("/login");
  }

  // Primary: owner check
  let result = await env.DB
    .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ? AND userId = ?")
    .bind(id, session.user.id)
    .first<Site>();

  // Fallback: collaborator invite check
  if (!result) {
    const invite = await env.DB
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(id, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (invite) {
      result = await env.DB
        .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ?")
        .bind(id)
        .first<Site>();
    }
  }

  if (!result) {
    redirect("/");
  }

  if (!flags.editorV2) {
    return <SiteEditor site={result} />;
  }
  return <SiteEditorV2 site={result} user={session.user} />;
}
