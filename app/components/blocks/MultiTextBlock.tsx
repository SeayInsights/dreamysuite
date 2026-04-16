interface Block { id: string; type: string; [key: string]: unknown }

export function MultiTextBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const mode = String(cfg.mode ?? "text");
  const heading = String(cfg.heading ?? "");
  const body = String(cfg.body ?? cfg.text ?? "");

  const labels: Record<string, string> = {
    text: "Text / List", schedule: "Schedule", faq: "Q & A",
    tidbits: "Fun Facts", travel: "Travel Info",
  };

  return (
    <section className="block block-text" data-block-id={block.id} data-block-type={block.type}>
      {heading && (
        <>
          <h2 className="section-heading">{heading}</h2>
          <div className="section-rule" aria-hidden="true" />
        </>
      )}
      <div className="text-body">
        {body ? <p>{body}</p> : (
          <p style={{ color: "#9b8e85", fontStyle: "italic" }}>
            {labels[mode] ?? "Text"} content will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
