import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import DashboardShell from "./dashboard-shell";

// Dashboard CSS — copied in Task 2.11
import "@/styles/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  );
}
