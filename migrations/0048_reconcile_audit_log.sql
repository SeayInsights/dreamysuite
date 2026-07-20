-- Reconcile the audit_log schema so logAudit() actually works.
--
-- 0035 created audit_log as (id, siteId NOT NULL, userId NOT NULL, action,
-- payload, createdAt NOT NULL). 0043 tried to (re)define it with the intended
-- shape (timestamp/detail/ip, nullable userId/siteId) via CREATE TABLE IF NOT
-- EXISTS, which was a silent no-op because the table already existed. As a
-- result src/lib/audit.ts's INSERT (id, userId, siteId, action, detail, ip)
-- always failed (missing detail/ip columns + NOT NULL createdAt/siteId/userId)
-- and was swallowed by its try/catch — every audit write was lost.
--
-- ADD COLUMN cannot relax the NOT NULL constraints, so rebuild the table to the
-- intended 0043 shape. Existing rows (0035 shape) are preserved best-effort:
-- payload -> detail, createdAt(epoch ms) -> ISO-8601 timestamp.

ALTER TABLE audit_log RENAME TO audit_log_old_0035;

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  userId TEXT,
  siteId TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT
);

INSERT INTO audit_log (id, timestamp, userId, siteId, action, detail, ip)
SELECT
  id,
  strftime('%Y-%m-%dT%H:%M:%fZ', createdAt / 1000.0, 'unixepoch'),
  userId,
  siteId,
  action,
  payload,
  NULL
FROM audit_log_old_0035;

DROP TABLE audit_log_old_0035;

CREATE INDEX IF NOT EXISTS idx_audit_log_userId ON audit_log(userId);
CREATE INDEX IF NOT EXISTS idx_audit_log_siteId ON audit_log(siteId);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
