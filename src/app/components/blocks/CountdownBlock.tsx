interface Block { id: string; type: string; [key: string]: unknown }

export function CountdownBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const label = String(cfg.label ?? "Until we say I do");

  return (
    <section className="block block-countdown" data-block-id={block.id} data-block-type={block.type}>
      <p className="countdown-label">{label}</p>
      <div className="countdown-units">
        <div className="countdown-unit"><span className="countdown-num">--</span><span className="countdown-unit-label">Days</span></div>
        <div className="countdown-unit"><span className="countdown-num">--</span><span className="countdown-unit-label">Hours</span></div>
        <div className="countdown-unit"><span className="countdown-num">--</span><span className="countdown-unit-label">Minutes</span></div>
        <div className="countdown-unit"><span className="countdown-num">--</span><span className="countdown-unit-label">Seconds</span></div>
      </div>
    </section>
  );
}
