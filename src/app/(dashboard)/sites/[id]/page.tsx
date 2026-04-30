import { redirect, notFound } from "next/navigation";
import { getEnv } from "@/lib/cloudflare";
import { getAuthSession } from "@/lib/auth-session";
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

  // Use shared cached session - prevents double-encoding
  const session = await getAuthSession();
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

  return <SiteEditorV2 site={result} user={session.user} />;
}
