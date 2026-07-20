import { describe, it, expect } from "vitest";
import { isGuestUnlocked, guestPwCookieName } from "./guest-gate";
import { hashGuestPassword } from "@/lib/crypto/guestPassword";

function fakeDb(guestPassword: string | null): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => ({ guestPassword }),
      }),
    }),
  } as unknown as D1Database;
}

describe("isGuestUnlocked", () => {
  it("allows a site with no guest password regardless of cookie", async () => {
    expect(await isGuestUnlocked(fakeDb(null), "s1", null)).toBe(true);
    expect(await isGuestUnlocked(fakeDb(null), "s1", "whatever")).toBe(true);
  });

  it("denies a protected site with no cookie or a wrong cookie", async () => {
    const stored = await hashGuestPassword("hunter2");
    expect(await isGuestUnlocked(fakeDb(stored), "s1", null)).toBe(false);
    expect(await isGuestUnlocked(fakeDb(stored), "s1", "wrong")).toBe(false);
  });

  it("allows a protected site when the cookie matches the stored hash", async () => {
    const stored = await hashGuestPassword("hunter2");
    expect(await isGuestUnlocked(fakeDb(stored), "s1", "hunter2")).toBe(true);
  });

  it("builds the ds_pw_<slug> cookie name", () => {
    expect(guestPwCookieName("john-and-jane")).toBe("ds_pw_john-and-jane");
  });
});
