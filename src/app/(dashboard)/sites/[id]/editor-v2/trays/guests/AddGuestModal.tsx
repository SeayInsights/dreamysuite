"use client";

import { useState } from "react";

import { BLANK_GUEST_FORM } from "./model";

const IN =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-ring";
const LB =
  "flex flex-col gap-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

export type GuestForm = typeof BLANK_GUEST_FORM;

interface AddGuestModalProps {
  categories: string[];
  onClose: () => void;
  /** Persist the new guest. Returns true on success (modal then closes). */
  onSubmit: (form: GuestForm) => Promise<boolean>;
}

/**
 * Add-guest form modal, extracted from SettingsGuests. Owns the draft form and
 * saving state; the parent handles persistence via `onSubmit` (which returns
 * whether the create succeeded) and closing via `onClose`. Behavior matches the
 * previous inline modal: on success the modal closes (and the draft resets on
 * unmount); on failure it stays open with the entered values.
 */
export function AddGuestModal({
  categories,
  onClose,
  onSubmit,
}: AddGuestModalProps) {
  const [form, setForm] = useState<GuestForm>(BLANK_GUEST_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof GuestForm) => (e: { target: { value: string } }) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const fld = (lbl: string, k: keyof GuestForm, t = "text") => (
    <label className={LB}>
      {lbl}
      <input type={t} value={form[k]} onChange={set(k)} className={IN} />
    </label>
  );

  const sel = (lbl: string, k: keyof GuestForm, opts: string[]) => (
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

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
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
            onClick={onClose}
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
  );
}
