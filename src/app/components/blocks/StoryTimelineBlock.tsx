import Image from "next/image";
import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface TimelineEvent {
  date?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

const DEFAULT_EVENTS: TimelineEvent[] = [
  { date: "2022", title: "We Met", description: "The beginning of our story." },
  { date: "2023", title: "Got Engaged", description: "They said yes!" },
  { date: "2026", title: "The Wedding", description: "Join us for our special day." },
];

export function StoryTimelineBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Our Story");
  const events: TimelineEvent[] = cfg.events === undefined
    ? DEFAULT_EVENTS
    : Array.isArray(cfg.events) ? cfg.events as TimelineEvent[] : [];

  return (
    <section className="block block-story-timeline" data-block-id={block.id} data-block-type={block.type}
      style={{ padding: "2rem 1rem", ...blockSectionStyle(cfg, breakpoint) }}>
      {heading && <TextEffectWrapper as="h2" style={{ textAlign: "center", marginBottom: "2rem" }}>{heading}</TextEffectWrapper>}
      {events.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", margin: "0 auto" }}>No events added yet.</p>
      ) : (
      <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0,
          width: "2px", background: "var(--border)", transform: "translateX(-50%)",
        }} aria-hidden />

        {events.map((event, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div key={i} style={{
              display: "flex",
              justifyContent: isLeft ? "flex-start" : "flex-end",
              marginBottom: "2rem",
              position: "relative",
            }}>
              {/* Dot */}
              <div style={{
                position: "absolute", left: "50%", top: "0.75rem",
                width: "12px", height: "12px",
                background: "var(--accent, #B8921A)",
                borderRadius: "50%",
                transform: "translateX(-50%)",
                zIndex: 1,
              }} aria-hidden />

              {/* Card */}
              <div style={{
                width: "44%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.875rem 1rem",
                marginLeft: isLeft ? 0 : undefined,
                marginRight: isLeft ? undefined : 0,
              }}>
                {event.imageUrl && (
                  <div style={{ position: "relative", width: "100%", height: "120px", marginBottom: "0.5rem" }}>
                    <Image src={event.imageUrl} alt={event.title || "Timeline photo"} fill sizes="(max-width: 768px) 100vw, 300px" style={{ borderRadius: "4px", objectFit: "cover" }} />
                  </div>
                )}
                {event.date && (
                  <p style={{ fontSize: "0.75rem", color: "var(--accent, #B8921A)", fontWeight: 600, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {event.date}
                  </p>
                )}
                {event.title && <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{event.title}</h4>}
                {event.description && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>{event.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
