import { betterAuth } from "better-auth";
import type { Env } from "./context";

export function createAuth(env: Env) {
  return betterAuth({
    database: {
      db: env.DB,
      type: "sqlite",
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
  });
}

export type Auth = ReturnType<typeof createAuth>;
