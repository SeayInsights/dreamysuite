export interface Guest {
  id: string;
  firstName: string;
  lastName: string | null;
  party: number | null;
  rsvpStatus: "pending" | "yes" | "no";
  notes: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  invitedBy: string | null;
  category: string | null;
  invited: number;
  ceremonyOrReception: string;
  invitationType: string;
  tableNumber: string | null;
  giftDescription: string | null;
  thankYouSent: number;
  customResponses: string | null;
}

export const GUEST_COLUMNS = [
  ["#", "#", "#"],
  ["firstName", "Name", "Tên"],
  ["email", "Email", "Email"],
  ["phone", "Phone", "Điện thoại"],
  ["address", "Address", "Địa chỉ"],
  ["category", "Category", "Nhóm"],
  ["invitedBy", "Invited By", "Người mời"],
  ["rsvpStatus", "RSVP", "Phản hồi"],
  ["invited", "Invite?", "Mời?"],
  ["invitationType", "Type", "Loại thiệp"],
  ["ceremonyOrReception", "Ceremony", "Lễ"],
  ["tableNumber", "Table", "Bàn"],
  ["giftDescription", "Gift", "Quà tặng"],
  ["thankYouSent", "Thank You", "Cảm ơn"],
  ["notes", "Notes", "Ghi chú"],
] as const;

export const BLANK_GUEST_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  category: "",
  invitedBy: "",
  ceremonyOrReception: "both",
  invitationType: "digital",
  tableNumber: "",
};

export const TEXT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "invitedBy",
  "tableNumber",
  "giftDescription",
  "notes",
] as const;

export const DROP_FIELDS: Record<string, string[]> = {
  rsvpStatus: ["pending", "yes", "no"],
  invitationType: ["digital", "printed", "both"],
  ceremonyOrReception: ["ceremony", "reception", "both"],
};

export const EXPORT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "category",
  "invitedBy",
  "rsvpStatus",
  "invitationType",
  "ceremonyOrReception",
  "tableNumber",
  "giftDescription",
  "notes",
] as const;

export const GUEST_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "category",
  "invitedBy",
  "ceremonyOrReception",
  "invitationType",
  "tableNumber",
  "notes",
  "giftDescription",
];

export const DEFAULT_CATEGORIES = [
  "Family",
  "Friends",
  "Coworkers",
  "Wedding Party",
];

export interface GuestFilters {
  search: string;
  category: string;
  rsvp: string;
  ceremony: string;
  invitationType: string;
  sortCol: string | null;
  sortDir: "asc" | "desc";
}

export function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  values.push(current.trim());
  return values;
}

export function getGuestCategories(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw ?? "");
    return Array.isArray(parsed) && parsed.length
      ? parsed.filter((c): c is string => typeof c === "string")
      : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function filterAndSortGuests(
  guests: Guest[],
  filters: GuestFilters,
): Guest[] {
  let list = guests;
  const search = filters.search.trim().toLowerCase();

  if (search) {
    list = list.filter((g) =>
      `${g.firstName} ${g.lastName ?? ""}`.toLowerCase().includes(search),
    );
  }
  if (filters.category) {
    list = list.filter((g) => g.category === filters.category);
  }
  if (filters.rsvp) {
    list = list.filter((g) => g.rsvpStatus === filters.rsvp);
  }
  if (filters.ceremony) {
    list = list.filter((g) => g.ceremonyOrReception === filters.ceremony);
  }
  if (filters.invitationType) {
    list = list.filter((g) => g.invitationType === filters.invitationType);
  }
  if (filters.sortCol) {
    list = [...list].sort((a, b) => {
      const av = guestValue(a, filters.sortCol!);
      const bv = guestValue(b, filters.sortCol!);
      return filters.sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }

  return list;
}

export function hasActiveGuestFilters(filters: GuestFilters): boolean {
  return Boolean(
    filters.search.trim() ||
    filters.category ||
    filters.rsvp ||
    filters.ceremony ||
    filters.invitationType,
  );
}

export function buildGuestCsv(guests: Guest[]): string {
  const header = EXPORT_FIELDS.join(",");
  const rows = guests.map((g) =>
    EXPORT_FIELDS.map((f) => csvEscape(guestValue(g, f))).join(","),
  );
  return [header, ...rows].join("\n");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function guestValue(guest: Guest, field: string): unknown {
  return (guest as unknown as Record<string, unknown>)[field] ?? "";
}
