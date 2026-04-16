import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import SignupForm from "./SignupForm";

export const metadata = {
  title: "Create account — DreamySuite",
};

export default async function SignupPage() {
  // Server-side auth check: redirect to / if already logged in
  const { env } = await getCloudflareContext({ async: true });
  const auth = createAuth(env as Parameters<typeof createAuth>[0]);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session) redirect("/");

  async function signupAction(
    _prevState: { error: string | null },
    formData: FormData
  ): Promise<{ error: string | null }> {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      return { error: "All fields are required." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const { env: actionEnv } = await getCloudflareContext({ async: true });
    const actionAuth = createAuth(actionEnv as Parameters<typeof createAuth>[0]);

    try {
      const response = await actionAuth.api.signUpEmail({
        body: { name, email, password },
        asResponse: true,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          error:
            (body as { message?: string }).message ?? "Could not create account.",
        };
      }

      // Forward set-cookie headers from better-auth into Next.js cookies
      const cookieStore = await cookies();
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[signup error]", msg);
      return { error: msg };
    }

    redirect("/");
  }

  return <SignupForm action={signupAction} />;
}
