import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";

export async function getEnv(): Promise<Env> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as Env;
}
