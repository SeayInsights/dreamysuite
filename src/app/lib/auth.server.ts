import { betterAuth } from "better-auth";

// Env interface mirrors workers/app.ts — bindings wired in Task 2.9
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  AUTH_SECRET: string;
  APP_URL: string;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  CANVA_CLIENT_ID: string;
  CANVA_CLIENT_SECRET: string;
  CANVA_REDIRECT_URI: string;
  RESEND_API_KEY: string;
}

// RATE LIMITING — add Cloudflare dashboard rule manually:
// Dashboard → your-zone → Security → WAF → Rate Limiting Rules
// Rule: Path matches /api/auth/* | Threshold: 10 req / 60s per IP | Action: Block (1 min)

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DreamySuite <hello@mail.dreamysuite.com>",
            to: [user.email],
            subject: "Reset your DreamySuite password",
            html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal">Reset your password</h2><p>Click below to set a new password for your DreamySuite account:</p><a href="${url}" style="display:inline-block;margin:1rem 0;padding:.75rem 1.5rem;background:#B8921A;color:#fff;text-decoration:none;border-radius:6px;font-family:inherit">Reset Password</a><p style="color:#a8a29e;font-size:.8rem;margin-top:1.5rem">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p></div>`,
          }),
        }).catch((err) => {
          console.error("[auth] reset password fetch failed:", err);
          return null;
        });
        if (res && !res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`[auth] reset password email rejected: ${res.status} ${body}`);
        }
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        console.log(`[auth] sendVerificationEmail called for ${user.email}, url: ${url}`);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DreamySuite <hello@mail.dreamysuite.com>",
            to: [user.email],
            subject: "Verify your DreamySuite email",
            html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal">Verify your email</h2><p>Click below to activate your DreamySuite account:</p><a href="${url}" style="display:inline-block;margin:1rem 0;padding:.75rem 1.5rem;background:#B8921A;color:#fff;text-decoration:none;border-radius:6px;font-family:inherit">Verify Email</a><p style="color:#a8a29e;font-size:.8rem;margin-top:1.5rem">If you didn't create an account, you can safely ignore this email.</p></div>`,
          }),
        }).catch((err) => {
          console.error("[auth] verification email fetch failed:", err);
          return null;
        });
        if (res && !res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`[auth] verification email rejected: ${res.status} ${body}`);
        }
      },
    },
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "Strict",
      },
    },
  });
}
