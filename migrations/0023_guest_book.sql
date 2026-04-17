-- Guest book entries — public submissions per site
CREATE TABLE IF NOT EXISTS "guest_book_entry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "guest_book_entry_siteId_idx" ON "guest_book_entry"("siteId");
