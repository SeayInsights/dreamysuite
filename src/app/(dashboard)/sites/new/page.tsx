import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";
import { NewSiteForm } from "./new-site-form";

export const metadata = { title: "New Site — DreamySuite" };

async function createSite(prevState: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  const auth = createAuth(typedEnv);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "wedding");
  const slugRaw = String(formData.get("slug") ?? "").trim();

  if (!name) return { error: "Site name is required." };

  const slug = slugRaw || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug may only contain lowercase letters, numbers, and hyphens." };
  }

  const id = `site_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const now = Date.now();

  try {
    await typedEnv.DB
      .prepare(
        "INSERT INTO site (id, userId, name, slug, eventType, previewColor, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, session.user.id, name, slug, eventType, "#B8921A", "draft", now, now)
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return { error: `The slug "${slug}" is already taken. Choose a different one.` };
    return { error: msg };
  }

  redirect(`/sites/${id}`);
}

export default async function NewSitePage() {
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  const auth = createAuth(typedEnv);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  return <NewSiteForm action={createSite} />;
}
