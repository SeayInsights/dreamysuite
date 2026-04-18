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
  const cfg = parseCfg(block.config);
  const label = String(cfg.label ?? "Until we say I do");
  const eventDate = useEditorStore((s) => s.settings.eventDate);
  const { days, hours, mins, secs } = useCountdown(eventDate);
  const hasDate = !!eventDate;

  return (
    <section className="block block-countdown" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <p className="countdown-label">{label}</p>
      <div className="countdown-units">
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? days : "--"}</span><span className="countdown-unit-label">Days</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? hours : "--"}</span><span className="countdown-unit-label">Hours</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? mins : "--"}</span><span className="countdown-unit-label">Minutes</span></div>
        <div className="countdown-unit"><span className="countdown-num">{hasDate ? secs : "--"}</span><span className="countdown-unit-label">Seconds</span></div>
      </div>
      {!hasDate && (
        <p style={{ fontSize: "0.75rem", color: "#9a8c7c", marginTop: "0.75rem", textAlign: "center" }}>
          Set event date in Content tab to start countdown
        </p>
      )}
    </section>
  );
}
