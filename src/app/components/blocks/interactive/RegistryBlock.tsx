"use client";

import { useState, useCallback } from "react";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import type { RegistryItem, Block, PopoverState, PopoverType } from "./RegistryBlockTypes";
import { STORE_LOGOS } from "./RegistryBlockTypes";
import { UrlPopover, FundPopover, GoalPopover } from "./RegistryPopovers";
import { PickerModal } from "./RegistryPickerModal";
import { StoreCard, FundCard, AddItemButton } from "./RegistryCards";

export function RegistryBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Registry");
  const subheading = String(cfg.subheading ?? "");
  const displayMode = String(cfg.displayMode ?? "grid");
  const items: RegistryItem[] = Array.isArray(cfg.items)
    ? (cfg.items as RegistryItem[]).filter((i) => i && typeof i === "object" && typeof i.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const editing = !fullPreview;

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // ── Item mutation helpers ─────────────────────────────────────────────────

  const addStoreItem = useCallback((store: string) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = { id: crypto.randomUUID(), type: "store", store, logoUrl: STORE_LOGOS[store] };
    updateBlock(block.id, { config: { ...currentCfg, items: [...currentItems, newItem] } });
  }, [block.id, block.config, updateBlock]);

  const addCustomStoreItem = useCallback(() => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = { id: crypto.randomUUID(), type: "store", customName: "Custom Registry" };
    updateBlock(block.id, { config: { ...currentCfg, items: [...currentItems, newItem] } });
  }, [block.id, block.config, updateBlock]);

  const addFundItem = useCallback((platform: RegistryItem["platform"]) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = { id: crypto.randomUUID(), type: "fund", platform, fundTitle: "" };
    updateBlock(block.id, { config: { ...currentCfg, items: [...currentItems, newItem] } });
  }, [block.id, block.config, updateBlock]);

  const deleteItem = useCallback((id: string) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    updateBlock(block.id, { config: { ...currentCfg, items: currentItems.filter((i) => i.id !== id) } });
  }, [block.id, block.config, updateBlock]);

  const updateItem = useCallback((id: string, patch: Partial<RegistryItem>) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    updateBlock(block.id, {
      config: { ...currentCfg, items: currentItems.map((i) => (i.id === id ? { ...i, ...patch } : i)) },
    });
  }, [block.id, block.config, updateBlock]);

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => { setDragIndex(index); }, []);
  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => { setDropIndex(index); }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDropIndex(null); return; }
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? [...(currentCfg.items as RegistryItem[])] : [];
    const [moved] = currentItems.splice(dragIndex, 1);
    currentItems.splice(index, 0, moved);
    updateBlock(block.id, { config: { ...currentCfg, items: currentItems } });
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, block.id, block.config, updateBlock]);

  const handleDragEnd = useCallback(() => { setDragIndex(null); setDropIndex(null); }, []);

  const handleOpenPopover = useCallback((type: PopoverType, itemId: string, rect: DOMRect) => {
    setPopover({ type, itemId, rect });
  }, []);
  const handleClosePopover = useCallback(() => setPopover(null), []);

  const activeItem = popover ? items.find((i) => i.id === popover.itemId) : null;

  const gridStyle: React.CSSProperties = displayMode === "list"
    ? { display: "grid", gridTemplateColumns: "1fr", gap: "1rem", maxWidth: "600px", margin: "2rem auto 0" }
    : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", maxWidth: "900px", margin: "2rem auto 0" };

  return (
    <section
      className="block block-registry"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg, breakpoint) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {subheading && (
        <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "1.5rem", maxWidth: "500px", marginLeft: "auto", marginRight: "auto", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {subheading}
        </p>
      )}

      {items.length === 0 && !editing && null}

      {items.length === 0 && editing && (
        <div style={{ maxWidth: "300px", margin: "2rem auto 0" }}>
          <AddItemButton onClick={() => setShowPicker(true)} />
        </div>
      )}

      {items.length > 0 && (
        <div style={gridStyle}>
          {items.map((item, i) => (
            item.type === "store" ? (
              <StoreCard
                key={item.id}
                item={item}
                index={i}
                editing={editing}
                isDragging={dragIndex === i}
                isDropTarget={dropIndex === i && dragIndex !== i}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onOpenPopover={handleOpenPopover}
              />
            ) : (
              <FundCard
                key={item.id}
                item={item}
                index={i}
                editing={editing}
                isDragging={dragIndex === i}
                isDropTarget={dropIndex === i && dragIndex !== i}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onOpenPopover={handleOpenPopover}
              />
            )
          ))}
          {editing && <AddItemButton onClick={() => setShowPicker(true)} />}
        </div>
      )}

      {showPicker && (
        <PickerModal
          onAddStore={addStoreItem}
          onAddCustomStore={addCustomStoreItem}
          onAddFund={addFundItem}
          onClose={() => setShowPicker(false)}
        />
      )}

      {popover && activeItem && popover.type === "url" && (
        <UrlPopover
          anchorRect={popover.rect}
          url={activeItem.url ?? ""}
          onSave={(val) => updateItem(popover.itemId, { url: val })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeItem && popover.type === "fund" && (
        <FundPopover
          anchorRect={popover.rect}
          platformUrl={activeItem.platformUrl ?? ""}
          platformHandle={activeItem.platformHandle ?? ""}
          onSave={(url, handle) => updateItem(popover.itemId, { platformUrl: url, platformHandle: handle })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeItem && popover.type === "goal" && (
        <GoalPopover
          anchorRect={popover.rect}
          value={activeItem.fundGoal}
          onSave={(val) => updateItem(popover.itemId, { fundGoal: val })}
          onClose={handleClosePopover}
        />
      )}
    </section>
  );
}
