import { describe, it, expect } from "vitest";
import { rewritePhotoUrlsToPublic } from "./publicImages";

describe("rewritePhotoUrlsToPublic", () => {
  it("rewrites an owner photo URL to the public image route", () => {
    const html = `<img src="/api/sites/site_abc123/photos/photo-xyz-1">`;
    expect(rewritePhotoUrlsToPublic(html)).toBe(
      `<img src="/api/img/photo-xyz-1">`,
    );
  });

  it("rewrites multiple occurrences, including inside CSS url()", () => {
    const html = `<div style="background-image:url('/api/sites/s1/photos/p1')"></div><img src="/api/sites/s2/photos/p2">`;
    const out = rewritePhotoUrlsToPublic(html);
    expect(out).toContain("/api/img/p1");
    expect(out).toContain("/api/img/p2");
    expect(out).not.toContain("/api/sites/");
  });

  it("leaves non-photo API URLs and external URLs untouched", () => {
    const html = `<a href="/api/sites/s1/settings">x</a><img src="https://cdn.example.com/a.jpg">`;
    expect(rewritePhotoUrlsToPublic(html)).toBe(html);
  });
});
