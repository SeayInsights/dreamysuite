import { describe, expect, it } from "vitest";
import { parseSubmissionData } from "./submission";

describe("parseSubmissionData", () => {
  it("validates rsvp data and fills defaults for absent fields", () => {
    expect(
      parseSubmissionData("rsvp", { rsvpStatus: "yes", partySize: 2 }),
    ).toEqual({
      type: "rsvp",
      guestName: null,
      rsvpStatus: "yes",
      partySize: 2,
      dietaryRestrictions: null,
    });
  });

  it("accepts a JSON string payload", () => {
    expect(parseSubmissionData("guestbook", '{"message":"congrats"}')).toEqual({
      type: "guestbook",
      message: "congrats",
      sentimentScore: null,
      photoUrl: null,
    });
  });

  it("falls back to all-null data on unparseable JSON", () => {
    expect(parseSubmissionData("rsvp", "not json")).toEqual({
      type: "rsvp",
      guestName: null,
      rsvpStatus: null,
      partySize: null,
      dietaryRestrictions: null,
    });
  });

  it("rejects an invalid enum value", () => {
    expect(() =>
      parseSubmissionData("rsvp", { rsvpStatus: "perhaps" }),
    ).toThrow();
  });

  it("rejects an unknown submission type", () => {
    expect(() => parseSubmissionData("mystery", {})).toThrow();
  });

  it("enforces email format where a schema requires it", () => {
    expect(() =>
      parseSubmissionData("registration", { registrantEmail: "not-an-email" }),
    ).toThrow();

    const ok = parseSubmissionData("registration", {
      registrantEmail: "a@b.com",
    });
    const blank = parseSubmissionData("registration", {});
    if (ok.type === "registration") expect(ok.registrantEmail).toBe("a@b.com");
    if (blank.type === "registration") expect(blank.registrantEmail).toBeNull();
  });

  it("routes every submission type through its matching schema", () => {
    for (const type of [
      "rsvp",
      "guestbook",
      "donation",
      "registration",
      "lead-form",
      "contact-form",
    ]) {
      expect(parseSubmissionData(type, {}).type).toBe(type);
    }
  });
});
