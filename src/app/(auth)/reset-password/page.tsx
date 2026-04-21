import { Suspense } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = {
  title: "Reset password — DreamySuite",
};

export default function ResetPasswordPage() {
  async function resetAction(
    _prevState: { error: string | null; success: boolean },
    formData: FormData
  ): Promise<{ error: string | null; success: boolean }> {
    "use server";
    const token = String(formData.get("token") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!token) {
      return { error: "Invalid or missing reset token.", success: false };
    }
    if (!newPassword || newPassword.length < 8) {
      return {
        error: "Password must be at least 8 characters.",
        success: false,
      };
    }
    if (newPassword !== confirmPassword) {
      return { error: "Passwords do not match.", success: false };
    }

    const { env } = await getCloudflareContext({ async: true });
    const auth = createAuth(env as Parameters<typeof createAuth>[0]);

    try {
      const response = await auth.api.resetPassword({
        body: { newPassword, token },
        asResponse: true,
      });

      if (!response.ok) {
        return {
          error: "This reset link is invalid or has expired. Please request a new one.",
          success: false,
        };
      }
    } catch {
      return {
        error: "This reset link is invalid or has expired. Please request a new one.",
        success: false,
      };
    }

    return { error: null, success: true };
  }

  return (
    <Suspense>
      <ResetPasswordForm action={resetAction} />
    </Suspense>
  );
}
