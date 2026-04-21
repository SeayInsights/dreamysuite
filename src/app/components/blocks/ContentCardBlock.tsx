"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import { FunFactPicker } from "./FunFactPicker";
import { FunFactCard } from "./FunFactCard";

interface LinkItem {
  label: string;
  url: string;
}

interface ContentCardItem {
  id?: string;
  question?: string;
  icon?: string;
  body?: string;
  links?: LinkItem[];
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

const LINK_BTN_STYLE: React.CSSProperties = {
  display: "inline-flex",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--accent, #B8921A)",
  border: "1px solid var(--accent, var(--border))",
  textDecoration: "none",
  background: "transparent",
};

function LinkButtons({ links }: { links: LinkItem[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
      {links.map((link, i) => (
        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={LINK_BTN_STYLE}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

interface LinkPopoverProps {
  anchorRect: DOMRect;
  existingLink?: LinkItem;
  onSave: (link: LinkItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function LinkPopover({ anchorRect, existingLink, onSave, onDelete, onClose }: LinkPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState(existingLink?.label ?? "");
  const [url, setUrl] = useState(existingLink?.url ?? "");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const top = anchorRect.bottom + 8;
  const left = anchorRect.left + anchorRect.width / 2;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg"
      style={{ top, left, transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{existingLink ? "Edit Button" : "Add Button"}</p>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Get Directions"
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="https://…"
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { if (label && url) onSave({ label, url }); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
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

interface CardWithLinksProps {
  item: ContentCardItem;
  index: number;
  cardStyle: React.CSSProperties;
  editing: boolean;
  onDelete: (id: string) => void;
  onAddLink: (itemId: string, link: LinkItem) => void;
  onEditLink: (itemId: string, linkIndex: number, link: LinkItem) => void;
  onDeleteLink: (itemId: string, linkIndex: number) => void;
}

function CardWithLinks({ item, index, cardStyle, editing, onDelete, onAddLink, onEditLink, onDeleteLink }: CardWithLinksProps) {
  const [linkPopover, setLinkPopover] = useState<{ rect: DOMRect; linkIndex?: number } | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  function handleAddLinkClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLinkPopover({ rect });
  }

  function handleEditLinkClick(e: React.MouseEvent, linkIndex: number) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLinkPopover({ rect, linkIndex });
  }

  const links = item.links ?? [];

  return (
    <div style={{ ...cardStyle, position: "relative" }} className="group/fact">
      {editing && item.id && (
        <button
          type="button"
          onClick={() => onDelete(item.id!)}
          className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
        >
          ✕
        </button>
      )}

      {item.icon && (
        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
      )}

      {(item.question || editing) && (
        <p
          style={{
            margin: "0 0 0.5rem",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--accent, var(--muted))",
            fontStyle: item.question ? "normal" : "italic",
            opacity: item.question ? 1 : 0.4,
          }}
          data-editable-item-index={index}
          data-editable-item-field="question"
          data-editable-array-key="items"
        >
          {item.question || "Double-click to add question"}
        </p>
      )}

      {(item.body || editing) && (
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--body-color)",
            lineHeight: 1.55,
            opacity: item.body ? 1 : 0.4,
            fontStyle: item.body ? "normal" : "italic",
          }}
          data-editable-item-index={index}
          data-editable-item-field="body"
          data-editable-array-key="items"
        >
          {item.body || "Double-click to add answer"}
        </p>
      )}

      {/* Link buttons */}
      {links.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          {links.map((link, li) => (
            <div key={li} style={{ position: "relative" }} className="group/link">
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={LINK_BTN_STYLE}>
                {link.label}
              </a>
              {editing && (
                <button
                  type="button"
                  onClick={(e) => handleEditLinkClick(e, li)}
                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full border border-border bg-popover text-[9px] text-muted-foreground shadow-sm hover:bg-accent/50 group-hover/link:flex"
                  title="Edit link"
                >
                  ✎
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Button trigger (edit mode only) */}
      {editing && (
        <button
          ref={addBtnRef}
          type="button"
          onClick={handleAddLinkClick}
          className="mt-2 hidden text-[10px] text-muted-foreground hover:text-primary transition-colors group-hover/fact:inline-block"
        >
          + Add Button
        </button>
      )}

      {!item.question && !item.body && !item.icon && !editing && links.length === 0 && (
        <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.85rem" }}>
          Empty card
        </span>
      )}

      {linkPopover && item.id && (
        <LinkPopover
          anchorRect={linkPopover.rect}
          existingLink={linkPopover.linkIndex !== undefined ? links[linkPopover.linkIndex] : undefined}
          onSave={(link) => {
            if (linkPopover.linkIndex !== undefined) {
              onEditLink(item.id!, linkPopover.linkIndex, link);
            } else {
              onAddLink(item.id!, link);
            }
            setLinkPopover(null);
          }}
          onDelete={linkPopover.linkIndex !== undefined ? () => {
            onDeleteLink(item.id!, linkPopover.linkIndex!);
            setLinkPopover(null);
          } : undefined}
          onClose={() => setLinkPopover(null)}
        />
      )}
    </div>
  );
}

export function ContentCardBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Fun Facts About Us");
  const columns = String(cfg.columns ?? "auto");
  const cardStyle = String(cfg.cardStyle ?? "card");
  const displayMode = String(cfg.displayMode ?? "facts");
  const items: ContentCardItem[] = Array.isArray(cfg.items)
    ? (cfg.items as ContentCardItem[]).filter((i) => i && typeof i === "object" && typeof i.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const editing = !fullPreview;
  const isSelected = selectedBlockId === block.id;
  void isSelected;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const pushItem = useCallback((question?: string) => {
    const newItem: ContentCardItem = {
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
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as ContentCardItem[]) : [];
    updateBlock(block.id, {
      config: { ...currentCfg, items: currentItems.filter((i) => i.id !== id) },
    });
  }, [block.id, block.config, updateBlock]);

  const addLink = useCallback((itemId: string, link: LinkItem) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as ContentCardItem[]) : [];
    updateBlock(block.id, {
      config: {
        ...currentCfg,
        items: currentItems.map((i) =>
          i.id === itemId ? { ...i, links: [...(i.links ?? []), link] } : i
        ),
      },
    });
  }, [block.id, block.config, updateBlock]);

  const editLink = useCallback((itemId: string, linkIndex: number, link: LinkItem) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as ContentCardItem[]) : [];
    updateBlock(block.id, {
      config: {
        ...currentCfg,
        items: currentItems.map((i) => {
          if (i.id !== itemId) return i;
          const newLinks = [...(i.links ?? [])];
          newLinks[linkIndex] = link;
          return { ...i, links: newLinks };
        }),
      },
    });
  }, [block.id, block.config, updateBlock]);

  const deleteLink = useCallback((itemId: string, linkIndex: number) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as ContentCardItem[]) : [];
    updateBlock(block.id, {
      config: {
        ...currentCfg,
        items: currentItems.map((i) => {
          if (i.id !== itemId) return i;
          const newLinks = (i.links ?? []).filter((_, idx) => idx !== linkIndex);
          return { ...i, links: newLinks };
        }),
      },
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

  // ── Accordion / FAQ modes ────────────────────────────────────────────────
  const isAccordionMode = displayMode === "accordion" || displayMode === "faq";
  // ── List mode ───────────────────────────────────────────────────────────
  const isListMode = displayMode === "list";
  // ── Travel mode ─────────────────────────────────────────────────────────
  const isTravelMode = displayMode === "travel";

  const emptyState = items.length === 0 && editing ? (
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
  ) : items.length === 0 ? null : null;

  if (items.length === 0) {
    return (
      <section
        className="block block-content-card"
        data-block-id={block.id}
        data-block-type={block.type}
        style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
      >
        <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
          {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
        </TextEffectWrapper>
        <div className="section-rule" aria-hidden="true" style={{ width: "3rem", height: "1px", margin: "0 auto 2.5rem" }} />
        {emptyState}
        {items.length === 0 && !editing && (
          <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem" }}>
            Add content in the panel
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className="block block-content-card"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" style={{ width: "3rem", height: "1px", margin: "0 auto 2.5rem" }} />

      {/* ── Accordion / FAQ ── */}
      {isAccordionMode && (
        <div style={{ maxWidth: "720px", margin: "0 auto", borderTop: "1px solid var(--border)" }}>
          {items.map((item, i) => {
            const isOpen = openAccordionId === (item.id ?? String(i));
            return (
              <div key={item.id ?? i} style={{ borderBottom: "1px solid var(--border)", position: "relative" }} className="group/fact">
                {editing && item.id && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id!)}
                    className="absolute right-8 top-3 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenAccordionId(isOpen ? null : (item.id ?? String(i)))}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "1rem 0", background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", fontWeight: 600, fontSize: "0.95rem",
                  }}
                  data-editable-item-index={i}
                  data-editable-item-field="question"
                  data-editable-array-key="items"
                >
                  <span>{item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Question</span>}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden
                    style={{ flexShrink: 0, marginLeft: "1rem", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  >
                    <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    style={{ paddingBottom: "1rem", color: "var(--body-color)", lineHeight: 1.6, fontSize: "0.9rem" }}
                    data-editable-item-index={i}
                    data-editable-item-field="body"
                    data-editable-array-key="items"
                  >
                    {item.body || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Answer</span>}
                    {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
                  </div>
                )}
              </div>
            );
          })}
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
      )}

      {/* ── List mode ── */}
      {isListMode && (
        <dl style={{ maxWidth: "720px", margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{ marginBottom: "1.5rem", position: "relative" }} className="group/fact">
              {editing && item.id && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id!)}
                  className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
                >
                  ✕
                </button>
              )}
              <dt
                style={{ fontWeight: 600, marginBottom: "0.375rem" }}
                data-editable-item-index={i}
                data-editable-item-field="question"
                data-editable-array-key="items"
              >
                {item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Question</span>}
              </dt>
              <dd
                style={{ margin: 0, color: "var(--body-color)", lineHeight: 1.6 }}
                data-editable-item-index={i}
                data-editable-item-field="body"
                data-editable-array-key="items"
              >
                {item.body || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Answer</span>}
              </dd>
              {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
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
        </dl>
      )}

      {/* ── Travel mode ── */}
      {isTravelMode && cardStyle === "list" && (
        <div style={{ maxWidth: "680px", margin: "2rem auto 0" }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{
              display: "flex", gap: "1rem", alignItems: "flex-start",
              padding: "0.875rem 0", borderBottom: "1px solid var(--border)",
              position: "relative",
            }} className="group/fact">
              {editing && item.id && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id!)}
                  className="absolute -right-2 -top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
                >
                  ✕
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {item.icon && (
                  <p style={{
                    margin: "0 0 0.2rem", fontSize: "0.72rem", fontWeight: 700,
                    color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {item.icon}
                  </p>
                )}
                {(item.question || editing) && (
                  <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.9rem" }}
                     data-editable-item-index={i} data-editable-item-field="question" data-editable-array-key="items">
                    {item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Heading</span>}
                  </p>
                )}
                {(item.body || editing) && (
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--body-color)", lineHeight: 1.5 }}
                     data-editable-item-index={i} data-editable-item-field="body" data-editable-array-key="items">
                    {item.body || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Details</span>}
                  </p>
                )}
                {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
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
      )}

      {/* ── Travel card grid ── */}
      {isTravelMode && cardStyle !== "list" && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.25rem",
            maxWidth: "900px",
            margin: "2rem auto 0",
          }}>
            {items.map((item, i) => (
              <div key={item.id ?? i} style={{
                background: "var(--bg, #fff)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "1.5rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                position: "relative",
              }} className="group/fact">
                {editing && item.id && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id!)}
                    className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
                  >
                    ✕
                  </button>
                )}
                {item.icon && (
                  <p style={{
                    margin: 0, fontSize: "0.72rem", fontWeight: 700,
                    color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {item.icon}
                  </p>
                )}
                {(item.question || editing) && (
                  <h4
                    style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}
                    data-editable-item-index={i}
                    data-editable-item-field="question"
                    data-editable-array-key="items"
                  >
                    {item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Heading</span>}
                  </h4>
                )}
                {(item.body || editing) && (
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "var(--body-color)", lineHeight: 1.55 }}
                    data-editable-item-index={i}
                    data-editable-item-field="body"
                    data-editable-array-key="items"
                  >
                    {item.body || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Details</span>}
                  </p>
                )}
                {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
                {!item.question && !item.body && !item.icon && !editing && (item.links ?? []).length === 0 && (
                  <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.85rem" }}>Empty travel card</span>
                )}
              </div>
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

      {/* ── Numbered mode (facts/general) ── */}
      {!isAccordionMode && !isListMode && !isTravelMode && cardStyle === "numbered" && (
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
                {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
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
      )}

      {/* ── Card grid (facts / general / bordered / flat) ── */}
      {!isAccordionMode && !isListMode && !isTravelMode && cardStyle !== "numbered" && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: columnsValue(columns),
            gap: "1.25rem",
            maxWidth: "900px",
            margin: "2rem auto 0",
          }}>
            {items.map((item, i) => (
              <CardWithLinks
                key={item.id ?? i}
                item={item}
                index={i}
                cardStyle={cardBorderStyle(cardStyle)}
                editing={editing}
                onDelete={deleteItem}
                onAddLink={addLink}
                onEditLink={editLink}
                onDeleteLink={deleteLink}
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
