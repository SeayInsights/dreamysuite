import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { flags } from "@/lib/flags";
import { SiteEditor } from "./editor";
import { SiteEditorV2 } from "./editor-v2";

// Cache session to avoid calling headers() multiple times (causes double-encoding)
const getCachedSession = cache(async () => {
  const env = await getEnv();
  const auth = createAuth(env);
  const requestHeaders = await headers();
  return auth.api.getSession({ headers: requestHeaders });
});

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

  // Use cached session to avoid double-encoding from calling headers() twice
  const session = await getCachedSession();

  if (!session) {
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
