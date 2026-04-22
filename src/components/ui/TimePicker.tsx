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
  placeholder?: string;
}

function toDate(hhmm: string): Date | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function toHHMM(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TimePicker({ value, onChange, className, autoFocus, onKeyDown, placeholder }: Props) {
  return (
    <ReactDatePicker
      selected={toDate(value)}
      onChange={(d: Date | null) => onChange(toHHMM(d))}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="h:mm aa"
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      placeholderText={placeholder}
      className={cn(
        "h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      popperClassName="!z-[10000]"
      showPopperArrow={false}
    />
  );
}
