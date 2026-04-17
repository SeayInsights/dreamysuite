CREATE TABLE IF NOT EXISTS block_translation (
  id        TEXT PRIMARY KEY,
  siteId    TEXT NOT NULL,
  blockId   TEXT NOT NULL,
  lang      TEXT NOT NULL,
  field     TEXT NOT NULL,
  value     TEXT NOT NULL DEFAULT '',
  updatedAt INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bt_block_lang_field
  ON block_translation (blockId, lang, field);

CREATE INDEX IF NOT EXISTS idx_bt_site_lang
  ON block_translation (siteId, lang);
