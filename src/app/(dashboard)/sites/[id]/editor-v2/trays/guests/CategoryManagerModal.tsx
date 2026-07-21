"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { Guest } from "./model";

const IN =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-ring";

interface CategoryManagerModalProps {
  categories: string[];
  guests: Guest[];
  onSaveCategories: (cats: string[]) => void;
  onClose: () => void;
}

/**
 * Guest-category management modal, extracted from SettingsGuests. Owns its own
 * transient input state (new-category text, rename target/value); the category
 * list and persistence come from the parent via props. Behavior matches the
 * previous inline modal — persistence still flows through the parent's
 * settings update.
 */
export function CategoryManagerModal({
  categories,
  guests,
  onSaveCategories,
  onClose,
}: CategoryManagerModalProps) {
  const [newCat, setNewCat] = useState("");
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState("");

  function addCat() {
    const t = newCat.trim();
    if (!t || categories.includes(t)) return;
    onSaveCategories([...categories, t]);
    setNewCat("");
  }
  function deleteCat(i: number) {
    if (guests.some((g) => g.category === categories[i])) return;
    onSaveCategories(categories.filter((_, j) => j !== i));
  }
  function renameCat(i: number) {
    const t = renameVal.trim();
    if (!t) return;
    const next = [...categories];
    next[i] = t;
    onSaveCategories(next);
    setRenamingIdx(null);
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-72 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl"
      >
        <h3 className="text-sm font-semibold">Manage Categories</h3>
        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {categories.map((cat, i) => (
            <li
              key={cat}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1"
            >
              {renamingIdx === i ? (
                <input
                  autoFocus
                  className="flex-1 rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={() => renameCat(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameCat(i);
                    else if (e.key === "Escape") setRenamingIdx(null);
                  }}
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer text-sm"
                  onClick={() => {
                    setRenamingIdx(i);
                    setRenameVal(cat);
                  }}
                >
                  {cat}
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteCat(i)}
                title={
                  guests.some((g) => g.category === cat) ? "In use" : "Delete"
                }
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-30"
                disabled={guests.some((g) => g.category === cat)}
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCat();
            }}
            placeholder="New category…"
            className={`${IN} flex-1`}
          />
          <button
            type="button"
            onClick={addCat}
            disabled={!newCat.trim()}
            className="flex items-center gap-1 rounded-md bg-foreground px-2 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
