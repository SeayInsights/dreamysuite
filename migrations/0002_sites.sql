CREATE TABLE IF NOT EXISTS "site" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "customDomain" TEXT,
  "eventType" TEXT,
  "previewColor" TEXT DEFAULT '#0d9488',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "site_userId_idx" ON "site"("userId");
