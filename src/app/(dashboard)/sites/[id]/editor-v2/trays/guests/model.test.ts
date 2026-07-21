import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  buildGuestCsv,
  filterAndSortGuests,
  getGuestCategories,
  hasActiveGuestFilters,
  parseCsv,
  type Guest,
  type GuestFilters,
} from "./model";

const baseFilters: GuestFilters = {
  search: "",
  category: "",
  rsvp: "",
  ceremony: "",
  invitationType: "",
  sortCol: null,
  sortDir: "asc",
};

const guests: Guest[] = [
  {
    id: "1",
    firstName: "Naomi",
    lastName: "Seay",
    party: null,
    rsvpStatus: "yes",
    notes: "Window seat",
    email: "naomi@example.com",
    phone: null,
    address: null,
    invitedBy: "Dannis",
    category: "Family",
    invited: 1,
    ceremonyOrReception: "both",
    invitationType: "printed",
    tableNumber: "1",
    giftDescription: null,
    thankYouSent: 0,
    customResponses: null,
  },
  {
    id: "2",
    firstName: "Alex",
    lastName: "Rivera",
    party: null,
    rsvpStatus: "pending",
    notes: null,
    email: "alex@example.com",
    phone: null,
    address: null,
    invitedBy: "Naomi",
    category: "Friends",
    invited: 1,
    ceremonyOrReception: "reception",
    invitationType: "digital",
    tableNumber: null,
    giftDescription: "Coffee maker, large",
    thankYouSent: 0,
    customResponses: null,
  },
];

describe("guest list model", () => {
  it("parses quoted CSV values with commas", () => {
    const parsed = parseCsv(
      'firstName,notes\nNaomi,"Window seat, near family"\nAlex,',
    );

    expect(parsed.headers).toEqual(["firstName", "notes"]);
    expect(parsed.rows).toEqual([
      { firstName: "Naomi", notes: "Window seat, near family" },
      { firstName: "Alex", notes: "" },
    ]);
  });

  it("filters and sorts guests predictably", () => {
    const result = filterAndSortGuests(guests, {
      ...baseFilters,
      category: "Family",
      sortCol: "firstName",
      sortDir: "desc",
    });

    expect(result.map((g) => g.firstName)).toEqual(["Naomi"]);
  });

  it("detects active filters independent of sorting", () => {
    expect(
      hasActiveGuestFilters({ ...baseFilters, sortCol: "firstName" }),
    ).toBe(false);
    expect(hasActiveGuestFilters({ ...baseFilters, search: "naomi" })).toBe(
      true,
    );
  });

  it("escapes CSV export values", () => {
    const csv = buildGuestCsv(guests);

    expect(csv).toContain('"Coffee maker, large"');
    expect(csv.split("\n")[0]).toContain("firstName,lastName,email");
  });

  it("returns default categories for missing or invalid input", () => {
    expect(getGuestCategories(null)).toEqual(DEFAULT_CATEGORIES);
    expect(getGuestCategories(undefined)).toEqual(DEFAULT_CATEGORIES);
    expect(getGuestCategories("")).toEqual(DEFAULT_CATEGORIES);
    expect(getGuestCategories("not json")).toEqual(DEFAULT_CATEGORIES);
    expect(getGuestCategories("[]")).toEqual(DEFAULT_CATEGORIES);
    expect(getGuestCategories('{"a":1}')).toEqual(DEFAULT_CATEGORIES);
  });

  it("parses a stored category list and keeps only strings", () => {
    expect(getGuestCategories('["Family","Friends"]')).toEqual([
      "Family",
      "Friends",
    ]);
    expect(getGuestCategories('["Family",1,"Friends",null]')).toEqual([
      "Family",
      "Friends",
    ]);
  });

  it("unescapes doubled quotes and handles CRLF + ragged rows", () => {
    const parsed = parseCsv(
      'firstName,notes\r\nNaomi,"say ""hi"""\r\n\r\nAlex',
    );

    expect(parsed.headers).toEqual(["firstName", "notes"]);
    expect(parsed.rows).toEqual([
      { firstName: "Naomi", notes: 'say "hi"' },
      { firstName: "Alex", notes: "" },
    ]);
  });

  it("filters by each dimension", () => {
    const names = (f: Partial<GuestFilters>) =>
      filterAndSortGuests(guests, { ...baseFilters, ...f }).map(
        (g) => g.firstName,
      );

    expect(names({ search: "rivera" })).toEqual(["Alex"]); // matches last name
    expect(names({ rsvp: "yes" })).toEqual(["Naomi"]);
    expect(names({ ceremony: "reception" })).toEqual(["Alex"]);
    expect(names({ invitationType: "printed" })).toEqual(["Naomi"]);
  });

  it("sorts ascending and preserves order when unsorted", () => {
    expect(
      filterAndSortGuests(guests, {
        ...baseFilters,
        sortCol: "firstName",
        sortDir: "asc",
      }).map((g) => g.firstName),
    ).toEqual(["Alex", "Naomi"]);
    expect(filterAndSortGuests(guests, baseFilters).map((g) => g.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("detects each active filter dimension", () => {
    for (const key of [
      "category",
      "rsvp",
      "ceremony",
      "invitationType",
    ] as const) {
      expect(hasActiveGuestFilters({ ...baseFilters, [key]: "x" })).toBe(true);
    }
    expect(hasActiveGuestFilters(baseFilters)).toBe(false);
  });

  it("round-trips comma values through export + parse", () => {
    const parsed = parseCsv(buildGuestCsv(guests));
    const alex = parsed.rows.find((r) => r.firstName === "Alex");

    expect(alex?.giftDescription).toBe("Coffee maker, large");
  });

  it("quotes values containing newlines on export", () => {
    const csv = buildGuestCsv([{ ...guests[0], giftDescription: "a\nb" }]);

    expect(csv).toContain('"a\nb"');
  });
});
