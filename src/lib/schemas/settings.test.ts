import { describe, it, expect } from "vitest";
import {
  ALLOWED_FIELDS,
  DEFAULTS,
  SettingsSchema,
  SettingsPatchSchema,
  upsertSiteSettings,
} from "./settings";

/**
 * Minimal D1 stub: captures each prepared statement + its bindings.
 * Only models the narrow surface upsertSiteSettings uses.
 */
function makeDbStub(firstResult: { siteId: string } | null) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async first() {
              calls.push({ sql, values });
              return firstResult;
            },
            async run() {
              calls.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
  return { db: db as unknown as D1Database, calls };
}

describe("settings schema — drift guards", () => {
  it("ALLOWED_FIELDS matches DEFAULTS keys", () => {
    expect(ALLOWED_FIELDS.length).toBe(Object.keys(DEFAULTS).length);
    expect(new Set(ALLOWED_FIELDS)).toEqual(new Set(Object.keys(DEFAULTS)));
  });

  it("DEFAULTS derives from SettingsSchema.parse({})", () => {
    expect(DEFAULTS).toEqual(SettingsSchema.parse({}));
  });
});

describe("SettingsPatchSchema — intBool transform", () => {
  it("isLive true → 1", () => {
    const res = SettingsPatchSchema.safeParse({ isLive: true });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.isLive).toBe(1);
  });

  it("isLive false → 0", () => {
    const res = SettingsPatchSchema.safeParse({ isLive: false });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.isLive).toBe(0);
  });

  it("isLive 1 (number) → 1", () => {
    const res = SettingsPatchSchema.safeParse({ isLive: 1 });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.isLive).toBe(1);
  });

  it("showNavBrand transforms the same way", () => {
    const res = SettingsPatchSchema.safeParse({ showNavBrand: true });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.showNavBrand).toBe(1);
  });
});

describe("SettingsPatchSchema — type validation", () => {
  it("rejects wrong type for string field", () => {
    const res = SettingsPatchSchema.safeParse({ accentColor: 123 });
    expect(res.success).toBe(false);
  });

  it("accepts empty patch", () => {
    const res = SettingsPatchSchema.safeParse({});
    expect(res.success).toBe(true);
  });

  it("accepts partial patch with valid field", () => {
    const res = SettingsPatchSchema.safeParse({ accentColor: "#FFF" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.accentColor).toBe("#FFF");
  });

  it("accepts nullable field set to null", () => {
    const res = SettingsPatchSchema.safeParse({ eventName: null });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.eventName).toBeNull();
  });
});

describe("upsertSiteSettings", () => {
  it("INSERTs full DEFAULTS + patch when no row exists", async () => {
    const { db, calls } = makeDbStub(null);
    await upsertSiteSettings(db, "site-1", { accentColor: "#FF0000" }, 1000);

    // 1) SELECT, 2) INSERT
    expect(calls).toHaveLength(2);
    expect(calls[0].sql).toMatch(/SELECT siteId FROM site_setting/);
    expect(calls[1].sql).toMatch(/^INSERT INTO site_setting/);

    const insertCall = calls[1];
    // bindings: [siteId, ...ALLOWED_FIELDS values, updatedAt]
    expect(insertCall.values).toHaveLength(1 + ALLOWED_FIELDS.length + 1);
    expect(insertCall.values[0]).toBe("site-1");
    expect(insertCall.values.at(-1)).toBe(1000);

    // Patched field landed in the right slot
    const accentIdx = 1 + ALLOWED_FIELDS.indexOf("accentColor");
    expect(insertCall.values[accentIdx]).toBe("#FF0000");

    // Unpatched fields reflect DEFAULTS (e.g. headingFont)
    const headingIdx = 1 + ALLOWED_FIELDS.indexOf("headingFont");
    expect(insertCall.values[headingIdx]).toBe(DEFAULTS.headingFont);
  });

  it("INSERT includes all 54 columns — drift guard for new fields", async () => {
    const { db, calls } = makeDbStub(null);
    await upsertSiteSettings(db, "site-1", {}, 1000);

    const insertSql = calls[1].sql;
    // Every ALLOWED_FIELD should appear quoted in the column list
    for (const field of ALLOWED_FIELDS) {
      expect(insertSql).toContain(`"${field}"`);
    }
    // Specifically the 4 fields that used to drift in template restore
    expect(insertSql).toContain(`"bgImageLayer"`);
    expect(insertSql).toContain(`"bgImageOpacity"`);
    expect(insertSql).toContain(`"siteMaxWidth"`);
    expect(insertSql).toContain(`"showNavBrand"`);
  });

  it("UPDATEs only present patch fields when row exists", async () => {
    const { db, calls } = makeDbStub({ siteId: "site-1" });
    await upsertSiteSettings(
      db,
      "site-1",
      { accentColor: "#00FF00", eventName: "Wedding" },
      2000,
    );

    expect(calls).toHaveLength(2);
    expect(calls[1].sql).toMatch(/^UPDATE site_setting/);
    // bindings follow ALLOWED_FIELDS iteration order (schema declaration
    // order), so eventName binds before accentColor, then updatedAt + siteId.
    expect(calls[1].values).toEqual(["Wedding", "#00FF00", 2000, "site-1"]);
    expect(calls[1].sql).toContain(`"accentColor" = ?`);
    expect(calls[1].sql).toContain(`"eventName" = ?`);
    // Other fields NOT in SQL
    expect(calls[1].sql).not.toContain(`"bgColor"`);
  });

  it("UPDATE with empty patch → no-op (only SELECT called)", async () => {
    const { db, calls } = makeDbStub({ siteId: "site-1" });
    await upsertSiteSettings(db, "site-1", {}, 3000);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toMatch(/SELECT/);
  });

  it("accepts full SettingsSchema-parsed object (restore path)", async () => {
    const { db, calls } = makeDbStub({ siteId: "site-1" });
    const full = SettingsSchema.parse({ accentColor: "#ABCDEF" });
    await upsertSiteSettings(db, "site-1", full, 4000);

    // All 54 fields updated
    expect(calls[1].sql).toMatch(/^UPDATE/);
    // bindings: 54 values + updatedAt + siteId
    expect(calls[1].values).toHaveLength(ALLOWED_FIELDS.length + 2);
    expect(calls[1].values.at(-1)).toBe("site-1");
    expect(calls[1].values.at(-2)).toBe(4000);
  });
});
