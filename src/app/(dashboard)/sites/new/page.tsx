import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { NewSiteForm } from "./new-site-form";
import { applyStarter, getStarter } from "@/lib/templates/starters";

export const metadata = { title: "New Site — DreamySuite" };

async function createSite(
  prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  "use server";
  const env = await getEnv();

  const auth = createAuth(env);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "wedding");
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "blank");

  if (!name) return { error: "Site name is required." };

  const slug =
    slugRaw ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      error: "Slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  const id = `site_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const now = Date.now();
  const previewColor = getStarter(templateId)?.previewColor ?? "#B8921A";

  try {
    await env.DB.prepare(
      "INSERT INTO site (id, userId, name, slug, eventType, previewColor, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        session.user.id,
        name,
        slug,
        eventType,
        previewColor,
        "draft",
        now,
        now,
      )
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE"))
      return {
        error: `The slug "${slug}" is already taken. Choose a different one.`,
      };
    return { error: msg };
  }

  // Pre-populate from the chosen starter (no-op for "blank"). A failure here
  // must not block site creation — the site already exists.
  try {
    await applyStarter(env.DB, id, templateId, now);
  } catch (err) {
    console.error("[createSite] applyStarter failed", err);
  }

  redirect(`/sites/${id}`);
}

export default async function NewSitePage() {
  const env = await getEnv();

  const auth = createAuth(env);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  return <NewSiteForm action={createSite} />;
}
