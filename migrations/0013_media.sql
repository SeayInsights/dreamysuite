-- Media items table: stores video links (YouTube/Vimeo) and music URLs per site
CREATE TABLE IF NOT EXISTS "media_item" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "mediaType" TEXT NOT NULL DEFAULT 'video',
  "url" TEXT NOT NULL,
  "title" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "media_item_siteId_idx" ON "media_item"("siteId");
