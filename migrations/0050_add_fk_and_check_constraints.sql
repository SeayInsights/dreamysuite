-- Add missing referential-integrity constraints. SQLite cannot ALTER a table
-- to add a foreign key, so each table is rebuilt (create-new / copy / drop /
-- rename / recreate indexes). Row counts are small (block=16, block_translation=5,
-- template=0) so the copy is cheap. Rebuild order matters: block first (nothing
-- references it yet), then block_translation (which gains a FK to block).
--
-- If prod contains orphan rows (a block whose siteId/pageId no longer exists, or
-- a translation whose blockId no longer exists) the copy will fail loudly rather
-- than silently drop data — that would indicate pre-existing corruption to fix.

PRAGMA foreign_keys=OFF;

-- block: add siteId -> site(id) ON DELETE CASCADE (previously only pageId had a FK);
-- also constrain isVisible to 0/1.
CREATE TABLE block_new (
  id TEXT NOT NULL PRIMARY KEY,
  siteId TEXT NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  pageId TEXT NOT NULL REFERENCES page(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isVisible INTEGER NOT NULL DEFAULT 1 CHECK (isVisible IN (0, 1)),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  overrides TEXT
);
INSERT INTO block_new (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt, overrides)
  SELECT id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt, overrides FROM block;
DROP TABLE block;
ALTER TABLE block_new RENAME TO block;
CREATE INDEX "block_pageId_idx" ON "block"("pageId");
CREATE INDEX "block_siteId_idx" ON "block"("siteId");

-- block_translation: add blockId -> block(id) and siteId -> site(id), both CASCADE.
CREATE TABLE block_translation_new (
  id TEXT PRIMARY KEY,
  siteId TEXT NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  blockId TEXT NOT NULL REFERENCES block(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updatedAt INTEGER NOT NULL DEFAULT 0
);
INSERT INTO block_translation_new (id, siteId, blockId, lang, field, value, updatedAt)
  SELECT id, siteId, blockId, lang, field, value, updatedAt FROM block_translation;
DROP TABLE block_translation;
ALTER TABLE block_translation_new RENAME TO block_translation;
CREATE UNIQUE INDEX idx_bt_block_lang_field ON block_translation (blockId, lang, field);
CREATE INDEX idx_bt_site_lang ON block_translation (siteId, lang);

-- template: make the site_type FK explicit (ON DELETE RESTRICT protects a
-- referenced site_type from being removed while templates still use it);
-- also constrain is_active to 0/1.
CREATE TABLE template_new (
  id TEXT PRIMARY KEY,
  site_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_r2_key TEXT,
  default_pages TEXT NOT NULL DEFAULT '[]',
  default_theme TEXT DEFAULT '{}',
  default_settings TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_type) REFERENCES site_type_config(site_type) ON DELETE RESTRICT
);
INSERT INTO template_new (id, site_type, name, description, thumbnail_r2_key, default_pages, default_theme, default_settings, is_active, sort_order, created_at)
  SELECT id, site_type, name, description, thumbnail_r2_key, default_pages, default_theme, default_settings, is_active, sort_order, created_at FROM template;
DROP TABLE template;
ALTER TABLE template_new RENAME TO template;
CREATE INDEX idx_template_type ON template(site_type, is_active);

PRAGMA foreign_keys=ON;
