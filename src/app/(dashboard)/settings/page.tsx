import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { AccountSettings } from "./account-settings";

export const metadata = { title: "Settings — DreamySuite" };

export default async function SettingsPage() {
  const env = await getEnv();
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return (
    <AccountSettings
      name={session.user.name ?? ""}
      email={session.user.email}
    />
  );
}
