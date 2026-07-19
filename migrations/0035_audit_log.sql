-- Audit log for ownership-changing operations
-- Actions: site.publish, site.delete, invite.create, invite.delete, domain.purchase, template.restore
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT NOT NULL PRIMARY KEY,
  siteId TEXT NOT NULL,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_siteId ON audit_log(siteId);
CREATE INDEX IF NOT EXISTS idx_audit_log_userId ON audit_log(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_createdAt ON audit_log(createdAt);
