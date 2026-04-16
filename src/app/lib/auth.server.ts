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

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
  });
}
