import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in — DreamySuite",
};

export default async function LoginPage() {
  // Server-side auth check: redirect to / if already logged in
  const { env } = await getCloudflareContext({ async: true });
  const auth = createAuth(env as Parameters<typeof createAuth>[0]);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session) redirect("/sites");

  return <LoginForm />;
}
