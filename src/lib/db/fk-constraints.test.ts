import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../../migrations/0050_add_fk_and_check_constraints.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const c = (db: DatabaseSync, sql: string): number =>
  (db.prepare(sql).get() as { c: number }).c;

function setup(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  // Minimal parent tables the FKs reference.
  db.exec(`CREATE TABLE site (id TEXT PRIMARY KEY);`);
  db.exec(`CREATE TABLE page (id TEXT PRIMARY KEY, siteId TEXT);`);
  db.exec(`CREATE TABLE site_type_config (site_type TEXT PRIMARY KEY);`);
  // Pre-0050 table shapes (matching prod).
  db.exec(
    `CREATE TABLE "block" ("id" TEXT NOT NULL PRIMARY KEY,"siteId" TEXT NOT NULL,"pageId" TEXT NOT NULL REFERENCES "page"("id") ON DELETE CASCADE,"type" TEXT NOT NULL,"config" TEXT NOT NULL DEFAULT '{}',"sortOrder" INTEGER NOT NULL DEFAULT 0,"isVisible" INTEGER NOT NULL DEFAULT 1,"createdAt" INTEGER NOT NULL,"updatedAt" INTEGER NOT NULL, overrides TEXT);`,
  );
  db.exec(
    `CREATE TABLE block_translation (id TEXT PRIMARY KEY,siteId TEXT NOT NULL,blockId TEXT NOT NULL,lang TEXT NOT NULL,field TEXT NOT NULL,value TEXT NOT NULL DEFAULT '',updatedAt INTEGER NOT NULL DEFAULT 0);`,
  );
  db.exec(
    `CREATE TABLE template (id TEXT PRIMARY KEY,site_type TEXT NOT NULL,name TEXT NOT NULL,description TEXT,thumbnail_r2_key TEXT,default_pages TEXT NOT NULL DEFAULT '[]',default_theme TEXT DEFAULT '{}',default_settings TEXT DEFAULT '{}',is_active INTEGER DEFAULT 1,sort_order INTEGER DEFAULT 0,created_at INTEGER DEFAULT (unixepoch()),FOREIGN KEY (site_type) REFERENCES site_type_config(site_type));`,
  );
  db.exec(`INSERT INTO site (id) VALUES ('s1');`);
  db.exec(`INSERT INTO page (id, siteId) VALUES ('p1','s1');`);
  db.exec(`INSERT INTO site_type_config (site_type) VALUES ('wedding');`);
  db.exec(
    `INSERT INTO block (id,siteId,pageId,type,config,sortOrder,isVisible,createdAt,updatedAt,overrides) VALUES ('b1','s1','p1','hero','{}',0,1,1,1,NULL);`,
  );
  db.exec(
    `INSERT INTO block_translation (id,siteId,blockId,lang,field,value,updatedAt) VALUES ('t1','s1','b1','vi','title','Xin chao',1);`,
  );
  db.exec(
    `INSERT INTO template (id,site_type,name) VALUES ('tpl1','wedding','Classic');`,
  );
  return db;
}

describe("0050 FK + CHECK constraints", () => {
  it("preserves data and enforces the new constraints", () => {
    const db = setup();
    db.exec(migration);
    db.exec("PRAGMA foreign_keys=ON;");

    // Data preserved through the rebuilds.
    expect(c(db, "SELECT count(*) c FROM block")).toBe(1);
    expect(c(db, "SELECT count(*) c FROM block_translation")).toBe(1);
    expect(c(db, "SELECT count(*) c FROM template")).toBe(1);
    expect(
      (
        db.prepare("SELECT siteId FROM block WHERE id='b1'").get() as {
          siteId: string;
        }
      ).siteId,
    ).toBe("s1");

    // block.siteId FK enforced.
    expect(() =>
      db
        .prepare(
          "INSERT INTO block (id,siteId,pageId,type,config,sortOrder,isVisible,createdAt,updatedAt) VALUES ('b2','NOPE','p1','x','{}',0,1,1,1)",
        )
        .run(),
    ).toThrow();

    // block.isVisible CHECK enforced.
    expect(() =>
      db
        .prepare(
          "INSERT INTO block (id,siteId,pageId,type,config,sortOrder,isVisible,createdAt,updatedAt) VALUES ('b3','s1','p1','x','{}',0,2,1,1)",
        )
        .run(),
    ).toThrow();

    // block_translation.blockId FK enforced.
    expect(() =>
      db
        .prepare(
          "INSERT INTO block_translation (id,siteId,blockId,lang,field,value,updatedAt) VALUES ('t2','s1','NOPE','vi','f','v',1)",
        )
        .run(),
    ).toThrow();

    // Deleting a site cascades to its blocks and translations.
    db.prepare("DELETE FROM site WHERE id='s1'").run();
    expect(c(db, "SELECT count(*) c FROM block")).toBe(0);
    expect(c(db, "SELECT count(*) c FROM block_translation")).toBe(0);

    db.close();
  });
});
