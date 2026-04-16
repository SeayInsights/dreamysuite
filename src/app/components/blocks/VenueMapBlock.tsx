interface Block { id: string; type: string; [key: string]: unknown }

export function VenueMapBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const embedUrl = String(cfg.embedUrl ?? cfg.mapUrl ?? "");
  const venueName = String(cfg.name ?? cfg.venueName ?? "Venue");

  return (
    <section className="block block-venue-map" data-block-id={block.id} data-block-type={block.type}>
      <h3 style={{ textAlign: "center", marginBottom: "0.75rem" }}>{venueName}</h3>
      {embedUrl ? (
        <div style={{ borderRadius: "8px", overflow: "hidden" }}>
          <iframe
            src={embedUrl}
            title={`Map of ${venueName}`}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
          Add a map embed URL to show the venue location.
        </p>
      )}
    </section>
  );
}
