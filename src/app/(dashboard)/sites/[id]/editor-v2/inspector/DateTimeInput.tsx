"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

// ── Date/Time Input ────────────────────────────────────────────────────────

export function DateTimeInput({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  helpText?: string;
}) {
  const dateVal = value?.slice(0, 10) ?? "";
  const timeVal = value?.slice(11, 16) ?? "";

  function update(date: string, time: string) {
    if (!date) {
      onChange(null);
      return;
    }
    onChange(time ? `${date}T${time}` : date);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <DatePicker
          value={dateVal}
          onChange={(v) => update(v, timeVal)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-9 flex-1"
        />
        <TimePicker
          value={timeVal}
          onChange={(v) => update(dateVal, v)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-9 w-28"
          placeholder="Time"
        />
      </div>
      {dateVal && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear date
        </button>
      )}
      {helpText && (
        <p className="text-xs leading-normal text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
