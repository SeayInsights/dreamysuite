import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface ScheduleEvent {
  id?: string;
  name?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
  dressCode?: string;
  icon?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

export function ScheduleBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Schedule of Events");
  const events: ScheduleEvent[] = Array.isArray(cfg.events) ? cfg.events as ScheduleEvent[] : [];

  return (
    <section
      className="block block-schedule"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {events.length === 0 ? (
        <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem" }}>
          Add events in the Content panel
        </p>
      ) : (
        <div className="timeline" style={{ maxWidth: "600px", margin: "2rem auto 0", position: "relative" }}>
          {/* Vertical rule */}
          <div style={{
            position: "absolute", left: "5.5rem", top: 0, bottom: 0,
            width: "2px", background: "#e0dbd4",
          }} aria-hidden="true" />

          {events.map((event, i) => (
            <div key={event.id ?? i} className="timeline-item" style={{
              display: "flex", gap: "1.25rem", marginBottom: "1.75rem", position: "relative",
            }}>
              {/* Time column */}
              <div className="timeline-time" style={{
                width: "4.5rem", flexShrink: 0, textAlign: "right",
                fontSize: "0.8rem", color: "var(--accent, #B8921A)", fontWeight: 600,
                paddingTop: "0.2rem",
              }}>
                {event.time || ""}
              </div>

              {/* Dot */}
              <div style={{
                position: "absolute", left: "5rem", top: "0.4rem",
                width: "10px", height: "10px",
                background: "var(--accent, #B8921A)", borderRadius: "50%",
                border: "2px solid #fff", zIndex: 1,
              }} aria-hidden="true" />

              {/* Content */}
              <div className="timeline-content" style={{ paddingLeft: "1.25rem", flex: 1 }}>
                <p style={{ margin: "0 0 0.125rem", fontWeight: 600, fontSize: "0.95rem" }}>
                  {event.icon && <span style={{ marginRight: "0.4rem" }}>{event.icon}</span>}
                  {event.name || <span style={{ color: "#9b8e85", fontStyle: "italic" }}>Event name</span>}
                </p>
                {event.location && (
                  <p style={{ margin: "0 0 0.125rem", fontSize: "0.82rem", color: "#6b6560" }}>{event.location}</p>
                )}
                {event.description && (
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b6560" }}>{event.description}</p>
                )}
                {event.dressCode && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#9b8e85" }}>
                    Dress code: {event.dressCode}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
