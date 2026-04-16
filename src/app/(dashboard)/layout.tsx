import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import DashboardShell from "./dashboard-shell";

// Dashboard CSS — copied in Task 2.11
import "@/styles/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cloudflare bindings are fully wired in Task 2.9.
  // getCloudflareContext() returns the CF env at runtime.
  const { env } = await getCloudflareContext({ async: true });

  const auth = createAuth(env as Parameters<typeof createAuth>[0]);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  );
}
