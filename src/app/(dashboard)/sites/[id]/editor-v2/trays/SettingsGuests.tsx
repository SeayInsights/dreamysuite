"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Plus, Trash2, X } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import {
  BLANK_GUEST_FORM,
  DROP_FIELDS,
  GUEST_COLUMNS,
  GUEST_FIELDS,
  TEXT_FIELDS,
  buildGuestCsv,
  filterAndSortGuests,
  getGuestCategories,
  hasActiveGuestFilters,
  parseCsv,
  type Guest,
} from "./guests/model";
import {
  ImportGuestsModal,
  type ImportState,
} from "./guests/ImportGuestsModal";
import { CategoryManagerModal } from "./guests/CategoryManagerModal";

const IN =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-ring";
const LB =
  "flex flex-col gap-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

export function GuestsPanel({ onBack }: { onBack: () => void }) {
  const siteId = useEditorStore((s) => s.siteId);
  const lang = useEditorStore((s) => s.settings?.mainLanguage ?? "en");
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(() => Boolean(siteId));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_GUEST_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(
    null,
  );
  const [editVal, setEditVal] = useState("");
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterRsvp, setFilterRsvp] = useState("");
  const [filterCeremony, setFilterCeremony] = useState("");
  const [filterType, setFilterType] = useState("");
  const [importModal, setImportModal] = useState<ImportState | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = getGuestCategories(settings?.guestCategories);

  useEffect(() => {
    if (!siteId) {
      return;
    }
    fetch(`/api/sites/${siteId}/guests`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setGuests((d as { guests: Guest[] }).guests))
      .catch(() =>
        setLoadError("Guests could not be loaded. Try refreshing this panel."),
      )
      .finally(() => setLoading(false));
  }, [siteId]);

  async function deleteGuest(id: string) {
    if (!siteId) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/guests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setActionError("That guest could not be deleted. Try again.");
    }
  }

  async function patchGuest(
    guestId: string,
    field: string,
    value: string | number,
  ) {
    if (!siteId) return;
    const prev = guests.find((g) => g.id === guestId);
    if (!prev) return;
    setActionError(null);
    setGuests((gs) =>
      gs.map((g) => (g.id === guestId ? { ...g, [field]: value } : g)),
    );
    try {
      const res = await fetch(`/api/sites/${siteId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Patch failed");
    } catch {
      setGuests((gs) => gs.map((g) => (g.id === guestId ? prev : g)));
      setActionError("That guest update could not be saved. Try again.");
    }
    setEditing(null);
  }

  async function addGuest(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!siteId) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/guests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Create failed");
      const { guest } = (await res.json()) as { guest: Guest };
      setGuests((prev) => [guest, ...prev]);
      setShowModal(false);
      setForm(BLANK_GUEST_FORM);
    } catch {
      setActionError(
        "That guest could not be added. Check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const cnt = (fn: (g: Guest) => boolean) => guests.filter(fn).length;

  const badge = (s: Guest["rsvpStatus"]) => (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background:
          s === "yes" ? "#dcfce7" : s === "no" ? "#fef2f2" : "#f5f5f4",
        color: s === "yes" ? "#166534" : s === "no" ? "#991b1b" : "#78716c",
      }}
    >
      {s === "yes" ? "Attending" : s === "no" ? "Declined" : "Pending"}
    </span>
  );

  const set =
    (k: keyof typeof BLANK_GUEST_FORM) => (e: { target: { value: string } }) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const fld = (lbl: string, k: keyof typeof BLANK_GUEST_FORM, t = "text") => (
    <label className={LB}>
      {lbl}
      <input type={t} value={form[k]} onChange={set(k)} className={IN} />
    </label>
  );

  const sel = (
    lbl: string,
    k: keyof typeof BLANK_GUEST_FORM,
    opts: string[],
  ) => (
    <label className={`${LB} flex-1`}>
      {lbl}
      <select value={form[k]} onChange={set(k)} className={IN}>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o ? o[0].toUpperCase() + o.slice(1) : "— Select —"}
          </option>
        ))}
      </select>
    </label>
  );

  function cell(
    g: Guest,
    field: string,
    display: ReactNode,
    tdClass = "px-2 py-1.5",
  ) {
    const isEditing = editing?.id === g.id && editing?.field === field;
    const startEdit = () => {
      setEditing({ id: g.id, field });
      setEditVal(
        String((g as unknown as Record<string, unknown>)[field] ?? ""),
      );
    };
    if (
      isEditing &&
      TEXT_FIELDS.includes(field as (typeof TEXT_FIELDS)[number])
    ) {
      return (
        <td key={field} className={tdClass}>
          <input
            autoFocus
            className="w-full rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={() => patchGuest(g.id, field, editVal)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") setEditing(null);
            }}
          />
        </td>
      );
    }
    if (isEditing && field in DROP_FIELDS) {
      const opts = DROP_FIELDS[field]!;
      return (
        <td key={field} className={tdClass}>
          <select
            autoFocus
            className="rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none"
            value={editVal}
            onChange={(e) => {
              patchGuest(g.id, field, e.target.value);
            }}
            onBlur={() => setEditing(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(null);
            }}
          >
            {opts.map((o) => (
              <option key={o} value={o}>
                {o[0].toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td
        key={field}
        className={`${tdClass} cursor-pointer`}
        onClick={startEdit}
      >
        {display}
      </td>
    );
  }

  const filtered = useMemo(() => {
    return filterAndSortGuests(guests, {
      search,
      category: filterCat,
      rsvp: filterRsvp,
      ceremony: filterCeremony,
      invitationType: filterType,
      sortCol,
      sortDir,
    });
  }, [
    guests,
    search,
    filterCat,
    filterRsvp,
    filterCeremony,
    filterType,
    sortCol,
    sortDir,
  ]);
  const filtersActive = hasActiveGuestFilters({
    search,
    category: filterCat,
    rsvp: filterRsvp,
    ceremony: filterCeremony,
    invitationType: filterType,
    sortCol,
    sortDir,
  });

  function clearFilters() {
    setSearch("");
    setFilterCat("");
    setFilterRsvp("");
    setFilterCeremony("");
    setFilterType("");
  }

  function toggleSort(col: string) {
    if (col === "#") return;
    setSortCol((p) => {
      if (p === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return col;
      }
      setSortDir("asc");
      return col;
    });
  }

  function exportCsv() {
    const blob = new Blob([buildGuestCsv(guests)], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const { headers, rows } = parseCsv(text);
        const mapping: Record<string, string> = {};
        headers.forEach((h) => {
          const match = GUEST_FIELDS.find(
            (f) => f.toLowerCase() === h.toLowerCase(),
          );
          mapping[h] = match ?? "";
        });
        setImportModal({ headers, rows, mapping });
        setActionError(null);
      } catch {
        setActionError(
          "That CSV file could not be read. Check the file and try again.",
        );
      }
    };
    reader.onerror = () =>
      setActionError(
        "That CSV file could not be read. Check the file and try again.",
      );
    reader.readAsText(file);
  }

  async function submitImport() {
    if (!importModal || !siteId) return;
    setImporting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/guests/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rows: importModal.rows,
          mapping: importModal.mapping,
        }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data = (await res.json()) as { imported: number; skipped: number };
      setImportResult(data);
      const r = await fetch(`/api/sites/${siteId}/guests`);
      if (!r.ok) throw new Error("Guest refresh failed");
      const d = (await r.json()) as { guests: Guest[] };
      setGuests(d.guests);
      setTimeout(() => {
        setImportModal(null);
        setImportResult(null);
      }, 2500);
    } catch {
      setActionError(
        "Guests could not be imported. Check the mapping and try again.",
      );
    } finally {
      setImporting(false);
    }
  }

  const siteName = settings?.eventName ?? "Site";

  return createPortal(
    <div
      data-tray-portal
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-background text-foreground"
    >
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1.5 hover:bg-accent/50"
          aria-label="Back to editor"
        >
          <X className="size-5 text-muted-foreground" />
        </button>
        <h1 className="flex-1 text-sm font-semibold">
          {siteName} — Guest List
        </h1>
        <button
          type="button"
          onClick={() => setShowCatMgr(true)}
          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30"
        >
          Categories
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30"
        >
          Export
        </button>
        <label className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30 cursor-pointer">
          Import
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90"
        >
          <Plus className="size-3.5" /> Add Guest
        </button>
      </div>
      <div className="flex items-center gap-4 border-b border-border px-4 py-2 text-xs">
        <span>
          Total <b>{guests.length}</b>
        </span>
        <span style={{ color: "#166534" }}>
          Attending <b>{cnt((g) => g.rsvpStatus === "yes")}</b>
        </span>
        <span style={{ color: "#991b1b" }}>
          Declined <b>{cnt((g) => g.rsvpStatus === "no")}</b>
        </span>
        <span className="text-muted-foreground">
          Pending <b>{cnt((g) => g.rsvpStatus === "pending")}</b>
        </span>
        <span className="text-muted-foreground">
          Printed{" "}
          <b>
            {cnt(
              (g) =>
                g.invitationType === "printed" || g.invitationType === "both",
            )}
          </b>
        </span>
      </div>
      {(loadError || actionError) && (
        <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <span>{actionError ?? loadError}</span>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setLoadError(null);
            }}
            className="rounded px-1.5 py-0.5 hover:bg-destructive/10"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <input
          placeholder="Search name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-ring min-w-[140px] max-w-xs flex-1"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterRsvp}
          onChange={(e) => setFilterRsvp(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"
        >
          <option value="">All RSVPs</option>
          <option value="pending">Pending</option>
          <option value="yes">Attending</option>
          <option value="no">Declined</option>
        </select>
        <select
          value={filterCeremony}
          onChange={(e) => setFilterCeremony(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"
        >
          <option value="">All events</option>
          <option value="ceremony">Ceremony</option>
          <option value="reception">Reception</option>
          <option value="both">Both</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"
        >
          <option value="">All types</option>
          <option value="digital">Digital</option>
          <option value="printed">Printed</option>
          <option value="both">Both</option>
        </select>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground hover:bg-accent/30"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Loading...
          </p>
        ) : guests.length === 0 ? (
          <div className="mx-3 my-3 rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
            <p>No guests yet.</p>
            <p>Click Add Guest or import a CSV to get started.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-3 my-3 flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
            <p>No guests match these filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-accent/30"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {GUEST_COLUMNS.map(([k, en, vi]) => (
                  <th
                    key={k}
                    className={`whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground${k !== "#" ? " cursor-pointer select-none hover:text-foreground" : ""}`}
                    onClick={() => toggleSort(k)}
                  >
                    {en}
                    {sortCol === k && (
                      <span className="ml-0.5 text-[10px]">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                    {lang === "vi" && (
                      <>
                        <br />
                        <span className="font-normal opacity-70">{vi}</span>
                      </>
                    )}
                  </th>
                ))}
                <th className="w-6 px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr
                  key={g.id}
                  className="group border-b border-border/50 hover:bg-accent/20"
                >
                  <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                  {cell(
                    g,
                    "firstName",
                    <>
                      {g.firstName} {g.lastName ?? ""}
                    </>,
                    "whitespace-nowrap px-2 py-1.5",
                  )}
                  {cell(
                    g,
                    "email",
                    g.email ?? "—",
                    "max-w-[100px] truncate px-2 py-1.5",
                  )}
                  {cell(
                    g,
                    "phone",
                    g.phone ?? "—",
                    "whitespace-nowrap px-2 py-1.5",
                  )}
                  {cell(
                    g,
                    "address",
                    g.address ?? "—",
                    "max-w-[100px] truncate px-2 py-1.5",
                  )}
                  {cell(g, "category", g.category ?? "—")}
                  {cell(
                    g,
                    "invitedBy",
                    g.invitedBy ?? "—",
                    "max-w-[80px] truncate px-2 py-1.5",
                  )}
                  {cell(g, "rsvpStatus", badge(g.rsvpStatus))}
                  <td
                    className="px-2 py-1.5 cursor-pointer"
                    onClick={() =>
                      patchGuest(g.id, "invited", g.invited === 1 ? 0 : 1)
                    }
                  >
                    {g.invited === 1 ? (
                      <Check className="size-3 text-green-600" />
                    ) : (
                      <span className="inline-block size-3 rounded-full border border-muted-foreground/40" />
                    )}
                  </td>
                  {cell(g, "invitationType", g.invitationType)}
                  {cell(g, "ceremonyOrReception", g.ceremonyOrReception)}
                  {cell(g, "tableNumber", g.tableNumber ?? "—")}
                  {cell(
                    g,
                    "giftDescription",
                    g.giftDescription ?? "—",
                    "max-w-[80px] truncate px-2 py-1.5",
                  )}
                  <td
                    className="px-2 py-1.5 cursor-pointer"
                    onClick={() =>
                      patchGuest(
                        g.id,
                        "thankYouSent",
                        g.thankYouSent === 1 ? 0 : 1,
                      )
                    }
                  >
                    {g.thankYouSent === 1 ? (
                      <Check className="size-3 text-green-600" />
                    ) : (
                      <span className="inline-block size-3 rounded-full border border-muted-foreground/40" />
                    )}
                  </td>
                  {cell(
                    g,
                    "notes",
                    g.notes ?? "—",
                    "max-w-[80px] truncate px-2 py-1.5",
                  )}
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => deleteGuest(g.id)}
                      className="rounded p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={addGuest}
            onClick={(e) => e.stopPropagation()}
            className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold">Add Guest</h3>
            <div className="flex gap-2">
              {fld("First Name", "firstName")}
              {fld("Last Name", "lastName")}
            </div>
            {fld("Email", "email", "email")}
            {fld("Phone", "phone", "tel")}
            {sel("Category", "category", ["", ...categories])}
            {fld("Invited By", "invitedBy")}
            <div className="flex gap-2">
              {sel("Ceremony/Reception", "ceremonyOrReception", [
                "ceremony",
                "reception",
                "both",
              ])}
              {sel("Invitation Type", "invitationType", [
                "digital",
                "printed",
                "both",
              ])}
            </div>
            {fld("Table #", "tableNumber")}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.firstName.trim()}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add Guest"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showCatMgr && (
        <CategoryManagerModal
          categories={categories}
          guests={guests}
          onSaveCategories={(cats) =>
            updateSettings({ guestCategories: JSON.stringify(cats) })
          }
          onClose={() => setShowCatMgr(false)}
        />
      )}

      {importModal && (
        <ImportGuestsModal
          state={importModal}
          setImportModal={setImportModal}
          result={importResult}
          importing={importing}
          onSubmit={submitImport}
        />
      )}
    </div>,
    document.body,
  );
}
