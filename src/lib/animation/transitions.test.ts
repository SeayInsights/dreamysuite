import { describe, expect, it } from "vitest";
import { TRANSITIONS, transition } from "./transitions";

describe("transition", () => {
  it("returns the preset string for a single key", () => {
    expect(transition("fast")).toBe(TRANSITIONS.fast);
  });

  it("comma-joins multiple presets in order", () => {
    expect(transition("opacity", "transform")).toBe(
      `${TRANSITIONS.opacity}, ${TRANSITIONS.transform}`,
    );
  });

  it("returns an empty string when given no keys", () => {
    expect(transition()).toBe("");
  });
});

describe("TRANSITIONS presets", () => {
  it("are all non-empty duration-bearing CSS strings", () => {
    for (const [key, value] of Object.entries(TRANSITIONS)) {
      expect(typeof value, key).toBe("string");
      expect(value.length, key).toBeGreaterThan(0);
      expect(value, key).toMatch(/\d+ms/); // carries an explicit duration
    }
  });
});
