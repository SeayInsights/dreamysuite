-- Append-only audit log for security-relevant events
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  userId TEXT,
  siteId TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_userId ON audit_log(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_siteId ON audit_log(siteId);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
-- NOTE: the CREATE TABLE above is a no-op on a fresh apply — 0035 already created
-- audit_log with its original shape (no "timestamp" column), so indexing
-- "timestamp" here fails with "no such column: timestamp". 0048 rebuilds the
-- table to this intended shape and (re)creates the timestamp index, so it is
-- dropped here to keep a fresh `migrations apply` working.
