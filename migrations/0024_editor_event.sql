CREATE TABLE IF NOT EXISTS editor_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  siteId TEXT,
  props TEXT,
  clientTs INTEGER NOT NULL,
  serverTs INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_editor_event_name ON editor_event (name);
CREATE INDEX IF NOT EXISTS idx_editor_event_site ON editor_event (siteId);
