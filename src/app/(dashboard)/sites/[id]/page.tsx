import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";
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
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  const auth = createAuth(typedEnv);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  // Primary: owner check
  let result = await typedEnv.DB
    .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ? AND userId = ?")
    .bind(id, session.user.id)
    .first<Site>();

  // Fallback: collaborator invite check
  if (!result) {
    const invite = await typedEnv.DB
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(id, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (invite) {
      result = await typedEnv.DB
        .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ?")
        .bind(id)
        .first<Site>();
    }
  }

  if (!result) {
    redirect("/");
  }

  if (!flags.editorV2) {
    return <SiteEditor site={result} user={session.user} />;
  }
  return <SiteEditorV2 site={result} user={session.user} />;
}
