CREATE TABLE IF NOT EXISTS "page" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isVisible" INTEGER NOT NULL DEFAULT 1,
  "isLocked" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  UNIQUE("siteId", "slug")
);
CREATE INDEX IF NOT EXISTS "page_siteId_idx" ON "page"("siteId");

CREATE TABLE IF NOT EXISTS "block" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL,
  "pageId" TEXT NOT NULL REFERENCES "page"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "config" TEXT NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" INTEGER NOT NULL DEFAULT 1,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "block_pageId_idx" ON "block"("pageId");
CREATE INDEX IF NOT EXISTS "block_siteId_idx" ON "block"("siteId");

CREATE TABLE IF NOT EXISTS "photo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "r2Key" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
  "size" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "photo_siteId_idx" ON "photo"("siteId");

CREATE TABLE IF NOT EXISTS "guest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "party" TEXT,
  "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "rsvpSubmittedAt" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "guest_siteId_idx" ON "guest"("siteId");

CREATE TABLE IF NOT EXISTS "site_setting" (
  "siteId" TEXT NOT NULL PRIMARY KEY REFERENCES "site"("id") ON DELETE CASCADE,
  "eventName" TEXT,
  "eventDate" TEXT,
  "eventLocation" TEXT,
  "greeting" TEXT,
  "musicUrl" TEXT,
  "mainLanguage" TEXT NOT NULL DEFAULT 'en',
  "secondLanguage" TEXT,
  "guestPassword" TEXT,
  "isLive" INTEGER NOT NULL DEFAULT 0,
  "headingFont" TEXT NOT NULL DEFAULT 'Georgia',
  "bodyFont" TEXT NOT NULL DEFAULT 'Inter',
  "accentColor" TEXT NOT NULL DEFAULT '#0d9488',
  "bgColor" TEXT NOT NULL DEFAULT '#ffffff',
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "site_content" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "pageSlug" TEXT NOT NULL,
  "lang" TEXT NOT NULL DEFAULT 'en',
  "content" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" INTEGER NOT NULL,
  UNIQUE("siteId", "pageSlug", "lang")
);

CREATE TABLE IF NOT EXISTS "site_template" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "siteId" TEXT NOT NULL REFERENCES "site"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "snapshot" TEXT NOT NULL DEFAULT '{}',
  "isPublished" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "site_template_siteId_idx" ON "site_template"("siteId");

CREATE TABLE IF NOT EXISTS "page_view" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "siteId" TEXT NOT NULL,
  "pageSlug" TEXT NOT NULL,
  "viewedAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "page_view_siteId_idx" ON "page_view"("siteId");
