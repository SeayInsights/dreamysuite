import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
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
  if (session) redirect("/");

  async function loginAction(
    _prevState: { error: string | null },
    formData: FormData
  ): Promise<{ error: string | null }> {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const { env: actionEnv } = await getCloudflareContext({ async: true });
    const actionAuth = createAuth(actionEnv as Parameters<typeof createAuth>[0]);

    try {
      const response = await actionAuth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      if (!response.ok) {
        return { error: "Invalid email or password." };
      }

      // Forward set-cookie headers from better-auth into Next.js cookies
      const cookieStore = await cookies();
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          // Parse "name=value; ..." and set via Next.js cookies API
          const [nameValue, ...parts] = value.split(";");
          const [cookieName, cookieValue] = nameValue.split("=");
          const options: Record<string, unknown> = { path: "/" };
          parts.forEach((part) => {
            const p = part.trim().toLowerCase();
            if (p === "httponly") options.httpOnly = true;
            if (p === "secure") options.secure = true;
            if (p.startsWith("max-age="))
              options.maxAge = parseInt(p.slice(8), 10);
            if (p.startsWith("samesite="))
              options.sameSite = p.slice(9) as "lax" | "strict" | "none";
          });
          cookieStore.set(cookieName.trim(), cookieValue?.trim() ?? "", options);
        }
      });
    } catch {
      return { error: "Invalid email or password." };
    }

    redirect("/");
  }

  return <LoginForm action={loginAction} />;
}
