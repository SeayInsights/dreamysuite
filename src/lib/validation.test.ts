import { describe, expect, it } from "vitest";
import { parseDomain, safeJsonParse } from "./validation";

describe("safeJsonParse", () => {
  it("parses valid JSON of any shape", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
    expect(safeJsonParse("[1,2,3]", [])).toEqual([1, 2, 3]);
    expect(safeJsonParse('"hi"', "")).toBe("hi");
    expect(safeJsonParse("42", 0)).toBe(42);
  });

  it("returns the fallback on unparseable input", () => {
    expect(safeJsonParse("not json", { ok: true })).toEqual({ ok: true });
    expect(safeJsonParse("", [])).toEqual([]);
    expect(safeJsonParse("{unquoted:1}", null)).toBeNull();
  });
});

describe("parseDomain", () => {
  it("reduces bare and full URLs to name + tld", () => {
    expect(parseDomain("example.com")).toEqual({
      name: "example.com",
      tld: "com",
    });
    expect(parseDomain("https://example.com/path?q=1")).toEqual({
      name: "example.com",
      tld: "com",
    });
    expect(parseDomain("HTTP://Example.COM")).toEqual({
      name: "example.com",
      tld: "com",
    });
    expect(parseDomain("  sub.example.co.uk  ")).toEqual({
      name: "sub.example.co.uk",
      tld: "uk",
    });
  });

  it("rejects malformed domains", () => {
    expect(parseDomain("invalid")).toBeNull(); // no dot
    expect(parseDomain("example.c")).toBeNull(); // 1-char tld
    expect(parseDomain("example.123")).toBeNull(); // numeric tld
    expect(parseDomain("-bad.com")).toBeNull(); // leading hyphen
    expect(parseDomain("bad-.com")).toBeNull(); // trailing hyphen
    expect(parseDomain("exa_mple.com")).toBeNull(); // underscore not allowed
  });
});
