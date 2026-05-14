import { describe, expect, it } from "vitest";
import {
  buildGuestCsv,
  filterAndSortGuests,
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
});
