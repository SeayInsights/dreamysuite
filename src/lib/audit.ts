type D1Database = {
  prepare: (q: string) => {
    bind: (...args: unknown[]) => { run: () => Promise<unknown> };
  };
};

export type AuditAction =
  | "login"
  | "logout"
  | "site.create"
  | "site.delete"
  | "site.publish"
  | "site.unpublish"
  | "settings.update"
  | "block.create"
  | "block.delete"
  | "photo.upload"
  | "photo.delete"
  | "guest.import"
  | "password.change";

export async function logAudit(
  db: D1Database,
  action: AuditAction,
  opts: {
    userId?: string | null;
    siteId?: string | null;
    detail?: string | null;
    ip?: string | null;
  } = {},
) {
  const id = crypto.randomUUID();
  try {
    await db
      .prepare(
        "INSERT INTO audit_log (id, userId, siteId, action, detail, ip) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        opts.userId ?? null,
        opts.siteId ?? null,
        action,
        opts.detail ?? null,
        opts.ip ?? null,
      )
      .run();
  } catch {
    console.error(`[audit] failed to log ${action}`, { id, ...opts });
  }
}
