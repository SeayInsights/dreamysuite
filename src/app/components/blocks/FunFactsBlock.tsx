"use client";

import { useState, useCallback, useRef } from "react";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import { FunFactPicker } from "./FunFactPicker";
import { FunFactCard } from "./FunFactCard";

interface FunFactItem {
  id?: string;
  question?: string;
  icon?: string;
  body?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

function cardBorderStyle(cardStyle: string): React.CSSProperties {
  if (cardStyle === "bordered") return { border: "1px solid var(--border)", borderRadius: "8px", padding: "1.25rem", background: "transparent" };
  if (cardStyle === "flat") return { padding: "0.75rem 0" };
  return { background: "var(--bg, #fff)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
}

function columnsValue(columns: string): string {
  if (columns === "2") return "repeat(2, 1fr)";
  if (columns === "3") return "repeat(3, 1fr)";
  if (columns === "4") return "repeat(4, 1fr)";
  return "repeat(auto-fill, minmax(220px, 1fr))";
}

function AddButton({ onClick, large }: { onClick: (e: React.MouseEvent) => void; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      style={{
        minHeight: large ? "120px" : "80px",
        width: "100%",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: large ? "2rem" : "1.5rem", lineHeight: 1 }}>+</span>
    </button>
  );
}

export function FunFactsBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Fun Facts About Us");
  const columns = String(cfg.columns ?? "auto");
  const cardStyle = String(cfg.cardStyle ?? "card");
  const items: FunFactItem[] = Array.isArray(cfg.items)
    ? (cfg.items as FunFactItem[]).filter((i) => i && typeof i === "object" && typeof i.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const editing = !fullPreview;
  const isSelected = selectedBlockId === block.id;

  const [pickerOpen, setPickerOpen] = useState(false);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const pushItem = useCallback((question?: string) => {
    const newItem: FunFactItem = {
      id: crypto.randomUUID(),
      question: question || "",
      body: "",
    };
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? currentCfg.items : [];
    updateBlock(block.id, {
      config: { ...currentCfg, items: [...currentItems, newItem] },
    });
  }, [block.id, block.config, updateBlock]);

  const deleteItem = useCallback((id: string) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as FunFactItem[]) : [];
    updateBlock(block.id, {
      config: { ...currentCfg, items: currentItems.filter((i) => i.id !== id) },
    });
  }, [block.id, block.config, updateBlock]);

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation();
    setPickerOpen(true);
  }

  function handleSelect(question: string) {
    setPickerOpen(false);
    pushItem(question);
  }

  function handleCustom() {
    setPickerOpen(false);
    pushItem();
  }

  const anchorRect = addBtnRef.current?.getBoundingClientRect() ?? null;

  return (
    <section
      className="block block-tidbits"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" style={{ width: "3rem", height: "1px", margin: "0 auto 2.5rem" }} />

      {items.length === 0 && editing ? (
        <div ref={addBtnRef} style={{ maxWidth: "400px", margin: "2rem auto 0" }}>
          <AddButton onClick={openPicker} large />
          <FunFactPicker
            open={pickerOpen}
            onSelect={handleSelect}
            onCustom={handleCustom}
            onClose={() => setPickerOpen(false)}
            anchorRect={anchorRect}
          />
        </div>
      ) : items.length === 0 ? null : cardStyle === "numbered" ? (
        <div style={{ maxWidth: "680px", margin: "2rem auto 0" }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "1.75rem", position: "relative" }} className="group/fact">
              {editing && item.id && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id!)}
                  className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
                >
                  ✕
                </button>
              )}
              <span style={{
                flexShrink: 0, fontFamily: "var(--heading-font)", fontSize: "2.5rem", fontWeight: 700,
                lineHeight: 1, color: "var(--accent)", opacity: 0.35, width: "3rem", textAlign: "right",
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                {item.icon && <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{item.icon}</div>}
                {(item.question || editing) && (
                  <p
                    style={{
                      margin: "0 0 0.25rem", fontSize: "0.8rem", fontWeight: 500,
                      color: "var(--accent, var(--muted))",
                      opacity: item.question ? 1 : 0.4,
                      fontStyle: item.question ? "normal" : "italic",
                    }}
                    data-editable-item-index={i} data-editable-item-field="question" data-editable-array-key="items"
                  >
                    {item.question || "Double-click to add question"}
                  </p>
                )}
                {(item.body || editing) && (
                  <p style={{
                      margin: 0, fontSize: "0.85rem", color: "var(--body-color)", lineHeight: 1.55,
                      opacity: item.body ? 1 : 0.4,
                      fontStyle: item.body ? "normal" : "italic",
                    }}
                     data-editable-item-index={i} data-editable-item-field="body" data-editable-array-key="items">
                    {item.body || "Double-click to add answer"}
                  </p>
                )}
              </div>
            </div>
          ))}
          {editing && (
            <div ref={addBtnRef} style={{ marginTop: "1rem" }}>
              <AddButton onClick={openPicker} />
              <FunFactPicker
                open={pickerOpen}
                onSelect={handleSelect}
                onCustom={handleCustom}
                onClose={() => setPickerOpen(false)}
                anchorRect={anchorRect}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: columnsValue(columns),
            gap: "1.25rem",
            maxWidth: "900px",
            margin: "2rem auto 0",
          }}>
            {items.map((item, i) => (
              <FunFactCard
                key={item.id ?? i}
                item={item}
                index={i}
                cardStyle={cardBorderStyle(cardStyle)}
                editing={editing}
                onDelete={deleteItem}
              />
            ))}
            {editing && (
              <div ref={addBtnRef}>
                <AddButton onClick={openPicker} />
              </div>
            )}
          </div>
          {editing && (
            <FunFactPicker
              open={pickerOpen}
              onSelect={handleSelect}
              onCustom={handleCustom}
              onClose={() => setPickerOpen(false)}
              anchorRect={anchorRect}
            />
          )}
        </>
      )}
    </section>
  );
}
