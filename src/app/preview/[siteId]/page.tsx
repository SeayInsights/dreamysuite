import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { settingsToTheme } from "@/app/stores/slices/theme";
import { parseCfg } from "@/lib/editableField";
import { detectDesignedAtWidth } from "@/lib/responsiveScale";
import { PreviewContent } from "./PreviewContent";

interface RawBlock {
  id: string;
  type: string;
  config: unknown;
  sortOrder: number;
  isVisible: number;
}

interface SiteSettings {
  accentColor?: string | null;
  bgColor?: string | null;
  bgImage?: string | null;
  bgImageOpacity?: number | null;
  sectionSpacing?: number | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  headingColor?: string | null;
  siteTextColor?: string | null;
  bodyColor?: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  return { title: `Preview — ${siteId}` };
}

export default async function PreviewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const env = await getEnv();
  const auth = createAuth(env);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) redirect("/login");

  const owned = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();

  if (!owned) {
    const invite = await env.DB
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (!invite) redirect("/");
  }

  const firstPage = await env.DB
    .prepare("SELECT id FROM page WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC LIMIT 1")
    .bind(siteId)
    .first<{ id: string }>();

  const rawBlocks: RawBlock[] = firstPage
    ? (await env.DB
        .prepare("SELECT id, type, config, sortOrder, isVisible FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
        .bind(firstPage.id)
        .all<RawBlock>()).results
    : [];

  const settings = await env.DB
    .prepare("SELECT accentColor, bgColor, bgImage, bgImageOpacity, sectionSpacing, headingFont, bodyFont, headingColor, siteTextColor, bodyColor FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first<SiteSettings>();

  const theme = settingsToTheme(settings ?? {});
  const blocks = rawBlocks.map((b) => ({ ...b, config: parseCfg(b.config) }));
  const designedAtWidth = detectDesignedAtWidth(blocks);

  return (
    <PreviewContent
      blocks={blocks}
      settings={settings ?? {}}
      theme={theme}
      designedAtWidth={designedAtWidth}
    />
  );
}
