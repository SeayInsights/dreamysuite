"use client";

import { type Dispatch, type SetStateAction } from "react";

import { GUEST_FIELDS } from "./model";

export interface ImportState {
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
}

interface ImportGuestsModalProps {
  state: ImportState;
  setImportModal: Dispatch<SetStateAction<ImportState | null>>;
  result: { imported: number; skipped: number } | null;
  importing: boolean;
  onSubmit: () => void;
}

/**
 * CSV-import preview + column-mapping modal for the Guests panel. Extracted
 * from SettingsGuests as a presentational component — all state and the import
 * action live in the parent and are passed in, so behavior is unchanged.
 */
export function ImportGuestsModal({
  state,
  setImportModal,
  result,
  importing,
  onSubmit,
}: ImportGuestsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40"
      onClick={() => setImportModal(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[480px] max-w-[96vw] flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-sm font-semibold">Import Guests</h3>
        {result ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Imported {result.imported}, skipped {result.skipped}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Preview (first 5 rows)
              </p>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      {state.headers.map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-2 py-1 text-left font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        {state.headers.map((h) => (
                          <td
                            key={h}
                            className="max-w-[80px] truncate px-2 py-1"
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Column mapping
              </p>
              <div className="flex flex-col gap-1">
                {state.headers.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                      {h}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <select
                      value={state.mapping[h] ?? ""}
                      onChange={(e) =>
                        setImportModal((p) =>
                          p
                            ? {
                                ...p,
                                mapping: {
                                  ...p.mapping,
                                  [h]: e.target.value,
                                },
                              }
                            : p,
                        )
                      }
                      className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus:border-ring"
                    >
                      <option value="">(skip)</option>
                      {GUEST_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModal(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={importing}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {importing ? "Importing…" : `Import ${state.rows.length} rows`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
