import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";

async function handler(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const auth = createAuth(env as Parameters<typeof createAuth>[0]);
  return auth.handler(req);
}

export { handler as GET, handler as POST };
