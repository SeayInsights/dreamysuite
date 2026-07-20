import { describe, it, expect } from "vitest";
import {
  isGuestUnlocked,
  guestPwCookieName,
  guestUnlockToken,
  guestCookieMatches,
} from "./guest-gate";
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

describe("guest-gate", () => {
  it("allows a site with no guest password regardless of cookie", async () => {
    expect(await isGuestUnlocked(fakeDb(null), "s1", null)).toBe(true);
    expect(await isGuestUnlocked(fakeDb(null), "s1", "whatever")).toBe(true);
  });

  it("denies a protected site with no cookie, a wrong cookie, or the raw password", async () => {
    const stored = await hashGuestPassword("hunter2");
    expect(await isGuestUnlocked(fakeDb(stored), "s1", null)).toBe(false);
    expect(await isGuestUnlocked(fakeDb(stored), "s1", "wrong")).toBe(false);
    // the plaintext password is NOT a valid unlock cookie — only the token is
    expect(await isGuestUnlocked(fakeDb(stored), "s1", "hunter2")).toBe(false);
  });

  it("unlock round-trip: the token minted from the stored hash unlocks (regression for the fails-closed bug)", async () => {
    const stored = await hashGuestPassword("hunter2");
    const cookie = guestUnlockToken(stored); // what the SSR route sets after a correct submit
    expect(await isGuestUnlocked(fakeDb(stored), "s1", cookie)).toBe(true);
    expect(guestCookieMatches(cookie, stored)).toBe(true);
    expect(guestCookieMatches("nope", stored)).toBe(false);
    expect(guestCookieMatches(null, stored)).toBe(false);
  });

  it("builds the ds_pw_<slug> cookie name", () => {
    expect(guestPwCookieName("john-and-jane")).toBe("ds_pw_john-and-jane");
  });
});
