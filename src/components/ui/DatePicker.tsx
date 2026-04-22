"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function toDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, className, autoFocus, onKeyDown }: Props) {
  return (
    <ReactDatePicker
      selected={toDate(value)}
      onChange={(d: Date | null) => onChange(toISO(d))}
      dateFormat="yyyy-MM-dd"
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      calendarClassName="ds-datepicker"
      popperClassName="!z-[10000]"
      showPopperArrow={false}
    />
  );
}
