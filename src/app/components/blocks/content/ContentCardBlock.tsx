"use client";

import { useState, useCallback, useRef } from "react";
import {
  blockSectionStyle,
  editableProps,
  parseCfg,
} from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import { FunFactPicker } from "./FunFactPicker";
import { AddButton } from "./ContentCardShared";
import { ContentCardAccordion } from "./ContentCardAccordion";
import { ContentCardList } from "./ContentCardList";
import { ContentCardNumbered } from "./ContentCardNumbered";
import { CardWithLinks } from "./ContentCardWithLinks";
import {
  cardBorderStyle,
  columnsValue,
  type Block,
  type LinkItem,
  type ContentCardItem,
} from "./ContentCardTypes";

export function ContentCardBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as
    | "desktop"
    | "tablet"
    | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Fun Facts About Us");
  const columns = String(cfg.columns ?? "auto");
  const cardStyle = String(cfg.cardStyle ?? "card");
  const displayMode = String(cfg.displayMode ?? "general");
  const items: ContentCardItem[] = Array.isArray(cfg.items)
    ? (cfg.items as ContentCardItem[]).filter(
        (i) => i && typeof i === "object" && typeof i.id === "string",
      )
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const editing = !fullPreview;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const pushItem = useCallback(
    (question?: string) => {
      const newItem: ContentCardItem = {
        id: crypto.randomUUID(),
        question: question || "",
        body: "",
      };
      const currentCfg = parseCfg(block.config);
      const currentItems = Array.isArray(currentCfg.items)
        ? currentCfg.items
        : [];
      updateBlock(block.id, {
        config: { ...currentCfg, items: [...currentItems, newItem] },
      });
    },
    [block.id, block.config, updateBlock],
  );

  const deleteItem = useCallback(
    (id: string) => {
      const currentCfg = parseCfg(block.config);
      const currentItems = Array.isArray(currentCfg.items)
        ? (currentCfg.items as ContentCardItem[])
        : [];
      updateBlock(block.id, {
        config: {
          ...currentCfg,
          items: currentItems.filter((i) => i.id !== id),
        },
      });
    },
    [block.id, block.config, updateBlock],
  );

  const addLink = useCallback(
    (itemId: string, link: LinkItem) => {
      const currentCfg = parseCfg(block.config);
      const currentItems = Array.isArray(currentCfg.items)
        ? (currentCfg.items as ContentCardItem[])
        : [];
      updateBlock(block.id, {
        config: {
          ...currentCfg,
          items: currentItems.map((i) =>
            i.id === itemId ? { ...i, links: [...(i.links ?? []), link] } : i,
          ),
        },
      });
    },
    [block.id, block.config, updateBlock],
  );

  const editLink = useCallback(
    (itemId: string, linkIndex: number, link: LinkItem) => {
      const currentCfg = parseCfg(block.config);
      const currentItems = Array.isArray(currentCfg.items)
        ? (currentCfg.items as ContentCardItem[])
        : [];
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
    },
    [block.id, block.config, updateBlock],
  );

  const deleteLink = useCallback(
    (itemId: string, linkIndex: number) => {
      const currentCfg = parseCfg(block.config);
      const currentItems = Array.isArray(currentCfg.items)
        ? (currentCfg.items as ContentCardItem[])
        : [];
      updateBlock(block.id, {
        config: {
          ...currentCfg,
          items: currentItems.map((i) => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              links: (i.links ?? []).filter((_, idx) => idx !== linkIndex),
            };
          }),
        },
      });
    },
    [block.id, block.config, updateBlock],
  );

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation();
    setPickerAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setPickerOpen(true);
  }

  const handleSelect = (question: string) => {
    setPickerOpen(false);
    pushItem(question);
  };
  const handleCustom = () => {
    setPickerOpen(false);
    pushItem();
  };

  const isAccordionMode = cardStyle === "accordion";
  const isListMode = cardStyle === "list";
  const isTravelMode = displayMode === "travel";

  const pickerProps = {
    pickerOpen,
    pickerAnchor,
    onOpenPicker: openPicker,
    onSelect: handleSelect,
    onCustom: handleCustom,
    onClosePicker: () => setPickerOpen(false),
  };

  const sectionStyle = {
    padding: "3rem 1.5rem",
    ...blockSectionStyle(cfg, breakpoint),
  };

  const sectionHeader = (
    <>
      <TextEffectWrapper
        as="h2"
        className="section-heading"
        {...editableProps(cfg, "heading")}
      >
        {heading || (
          <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>
        )}
      </TextEffectWrapper>
      <div
        className="section-rule"
        aria-hidden="true"
        style={{ width: "3rem", height: "1px", margin: "0 auto 2.5rem" }}
      />
    </>
  );

  if (items.length === 0) {
    return (
      <section
        className="block block-content-card"
        data-block-id={block.id}
        data-block-type={block.type}
        style={sectionStyle}
      >
        {sectionHeader}
        {editing ? (
          <div
            ref={addBtnRef}
            style={{ maxWidth: "400px", margin: "2rem auto 0" }}
          >
            <AddButton onClick={openPicker} large />
            <FunFactPicker
              open={pickerOpen}
              onSelect={handleSelect}
              onCustom={handleCustom}
              onClose={() => setPickerOpen(false)}
              anchorRect={pickerAnchor}
              displayMode={displayMode}
            />
          </div>
        ) : (
          <p
            style={{
              color: "var(--site-muted)",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: "1.5rem",
            }}
          >
            Add content in the panel
          </p>
        )}
      </section>
    );
  }

  const cardGridStyle = {
    display: "grid",
    gridTemplateColumns: columnsValue(columns),
    gap: "1.25rem",
    maxWidth: "900px",
    margin: "2rem auto 0",
  };

  const cardLinkHandlers = {
    onDelete: deleteItem,
    onAddLink: addLink,
    onEditLink: editLink,
    onDeleteLink: deleteLink,
  };

  return (
    <section
      className="block block-content-card"
      data-block-id={block.id}
      data-block-type={block.type}
      style={sectionStyle}
    >
      {sectionHeader}

      {isAccordionMode && (
        <ContentCardAccordion
          items={items}
          editing={editing}
          displayMode={displayMode}
          openAccordionId={openAccordionId}
          onToggleAccordion={setOpenAccordionId}
          onDelete={deleteItem}
          {...pickerProps}
        />
      )}

      {isListMode && (
        <ContentCardList
          items={items}
          editing={editing}
          displayMode={displayMode}
          onDelete={deleteItem}
          {...pickerProps}
        />
      )}

      {isTravelMode &&
        !isAccordionMode &&
        !isListMode &&
        cardStyle !== "numbered" && (
          <>
            <div style={cardGridStyle}>
              {items.map((item, i) => (
                <CardWithLinks
                  key={item.id ?? i}
                  item={item}
                  index={i}
                  cardStyle={{
                    ...cardBorderStyle(cardStyle),
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                  editing={editing}
                  displayMode={displayMode}
                  {...cardLinkHandlers}
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
                anchorRect={pickerAnchor}
                displayMode={displayMode}
              />
            )}
          </>
        )}

      {!isAccordionMode && !isListMode && cardStyle === "numbered" && (
        <ContentCardNumbered
          items={items}
          editing={editing}
          displayMode={displayMode}
          onDelete={deleteItem}
          {...pickerProps}
        />
      )}

      {!isAccordionMode &&
        !isListMode &&
        !isTravelMode &&
        cardStyle !== "numbered" && (
          <>
            <div style={cardGridStyle}>
              {items.map((item, i) => (
                <CardWithLinks
                  key={item.id ?? i}
                  item={item}
                  index={i}
                  cardStyle={cardBorderStyle(cardStyle)}
                  editing={editing}
                  displayMode={displayMode}
                  {...cardLinkHandlers}
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
                anchorRect={pickerAnchor}
                displayMode={displayMode}
              />
            )}
          </>
        )}
    </section>
  );
}
