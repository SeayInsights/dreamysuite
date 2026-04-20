"use client";

import { useState } from "react";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface FaqItem {
  id?: string;
  question?: string;
  answer?: string;
  category?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

function AccordionItem({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1rem 0", background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontWeight: 600, fontSize: "0.95rem",
        }}
        data-editable-item-index={index}
        data-editable-item-field="question"
        data-editable-array-key="items"
      >
        <span>{item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Question</span>}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden
          style={{ flexShrink: 0, marginLeft: "1rem", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          style={{ paddingBottom: "1rem", color: "var(--body-color)", lineHeight: 1.6, fontSize: "0.9rem" }}
          data-editable-item-index={index}
          data-editable-item-field="answer"
          data-editable-array-key="items"
        >
          {item.answer || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Answer</span>}
        </div>
      )}
    </div>
  );
}

export function FaqBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Frequently Asked Questions");
  const displayMode = String(cfg.displayMode ?? "list");
  const items: FaqItem[] = Array.isArray(cfg.items) ? cfg.items as FaqItem[] : [];

  return (
    <section
      className="block block-faq"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem" }}>
          Add questions in the Content panel
        </p>
      ) : displayMode === "accordion" ? (
        <div style={{ maxWidth: "720px", margin: "0 auto", borderTop: "1px solid var(--border)" }}>
          {items.map((item, i) => (
            <AccordionItem key={item.id ?? i} item={item} index={i} />
          ))}
        </div>
      ) : (
        <dl className="faq-list" style={{ maxWidth: "720px", margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{ marginBottom: "1.5rem" }}>
              <dt
                className="faq-question"
                style={{ fontWeight: 600, marginBottom: "0.375rem" }}
                data-editable-item-index={i}
                data-editable-item-field="question"
                data-editable-array-key="items"
              >
                {item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Question</span>}
              </dt>
              <dd
                className="faq-answer"
                style={{ margin: 0, color: "var(--body-color)", lineHeight: 1.6 }}
                data-editable-item-index={i}
                data-editable-item-field="answer"
                data-editable-array-key="items"
              >
                {item.answer || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Answer</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
