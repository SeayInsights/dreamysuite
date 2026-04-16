-- Site collaborator invites
CREATE TABLE IF NOT EXISTS site_invite (
  id          TEXT PRIMARY KEY,
  siteId      TEXT NOT NULL,
  email       TEXT NOT NULL,
  invitedBy   TEXT NOT NULL,
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (siteId) REFERENCES site(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_invite_siteId ON site_invite(siteId);
