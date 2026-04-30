"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!target) return;
    function calc() {
      const diff = Math.max(0, new Date(target!).getTime() - Date.now());
      setRemaining({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        mins: Math.floor((diff % 3_600_000) / 60_000),
        secs: Math.floor((diff % 60_000) / 1_000),
      });
    }
    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

export function CountdownBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const label = String(cfg.label ?? "Until we say I do");
  const daysLabel = String(cfg.daysLabel ?? "Days");
  const hoursLabel = String(cfg.hoursLabel ?? "Hours");
  const minsLabel = String(cfg.minsLabel ?? "Minutes");
  const secsLabel = String(cfg.secsLabel ?? "Seconds");
  const showRsvpButton = cfg.showRsvpButton === true;
  const eventDate = useEditorStore((s) => s.settings.eventDate);
  const fullPreview = useEditorStore((s) => s.fullPreview);
  const editing = !fullPreview;
  const { days, hours, mins, secs } = useCountdown(eventDate);
  const hasDate = !!eventDate;

  function scrollToRsvp() {
    const el =
      document.querySelector('[data-block-type="rsvp-form"]') ??
      document.querySelector('[data-block-type="rsvp"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="block block-countdown" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      <p className="countdown-label" data-editable-field="label">{label}</p>
      <div className="countdown-units">
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? days : "--"}</span><span className="countdown-unit-label" data-editable-field="daysLabel">{daysLabel}</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? hours : "--"}</span><span className="countdown-unit-label" data-editable-field="hoursLabel">{hoursLabel}</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? mins : "--"}</span><span className="countdown-unit-label" data-editable-field="minsLabel">{minsLabel}</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? secs : "--"}</span><span className="countdown-unit-label" data-editable-field="secsLabel">{secsLabel}</span></div>
      </div>
      {showRsvpButton && (
        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            type="button"
            onClick={scrollToRsvp}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            RSVP
          </button>
        </div>
      )}
      {!hasDate && editing && (
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem", textAlign: "center", fontStyle: "italic" }}>
          Set your event date in Page Settings &rarr; Info to start the countdown
        </p>
      )}
    </section>
  );
}
