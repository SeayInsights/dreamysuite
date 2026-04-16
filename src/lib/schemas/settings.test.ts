import { describe, it, expect } from "vitest";
import {
  ALLOWED_FIELDS,
  DEFAULTS,
  SettingsSchema,
  SettingsPatchSchema,
} from "./settings";

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
