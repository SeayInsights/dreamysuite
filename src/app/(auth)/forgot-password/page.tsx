import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Forgot password — DreamySuite",
};

export default function ForgotPasswordPage() {
  async function forgotAction(
    _prevState: { error: string | null; success: boolean },
    formData: FormData
  ): Promise<{ error: string | null; success: boolean }> {
    "use server";
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      return { error: "Please enter your email address.", success: false };
    }

    const { env } = await getCloudflareContext({ async: true });
    const auth = createAuth(env as Parameters<typeof createAuth>[0]);

    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: "/reset-password",
        },
      });
    } catch {
      // Swallow errors — never reveal whether the email exists
    }

    return { error: null, success: true };
  }

  return <ForgotPasswordForm action={forgotAction} />;
}
