-- Index the custom-domain lookup used to resolve an incoming custom hostname to
-- its site (SELECT slug FROM site WHERE customDomain = ?). Runs on every custom
-- domain page request; without an index it's a full table scan of `site`.
-- Partial index: only the small set of rows that actually have a custom domain.
CREATE INDEX IF NOT EXISTS "site_customDomain_idx"
  ON "site" ("customDomain")
  WHERE "customDomain" IS NOT NULL;
