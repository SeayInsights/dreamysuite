"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";
import type { Block } from "@/app/stores/editorStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuPosition {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function duplicateBlock(blocks: Block[], targetId: string): Block[] {
  const idx = blocks.findIndex((b) => b.id === targetId);
  if (idx === -1) return blocks;
  const original = blocks[idx];
  const sortOrder =
    typeof original.sortOrder === "number" ? original.sortOrder : idx;
  const copy: Block = { ...original, id: generateId(), sortOrder: sortOrder + 0.5 };
  const next = [...blocks];
  next.splice(idx + 1, 0, copy);
  return next;
}



// ---------------------------------------------------------------------------
// Menu item sub-component
// ---------------------------------------------------------------------------

interface MenuItemProps {
  label: string;
  shortcut?: string;
  variant?: "default" | "destructive";
  onClick: () => void;
}

function MenuItem({ label, shortcut, variant = "default", onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-8 rounded-sm px-2 py-1.5",
        "text-left text-sm transition-colors",
        "focus:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        variant === "destructive" &&
          "text-destructive hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="text-[10px] text-muted-foreground">{shortcut}</span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}

// ---------------------------------------------------------------------------
// Floating context menu (portal-less, position:fixed)
// ---------------------------------------------------------------------------

interface FloatingMenuProps {
  open: boolean;
  position: MenuPosition;
  onClose: () => void;
  children: ReactNode;
}

function FloatingMenu({ open, position, onClose, children }: FloatingMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Clamp to viewport so the menu doesn't bleed off-screen
  const MENU_WIDTH = 200;
  const MENU_HEIGHT = 160;
  const clampedX = Math.min(position.x, window.innerWidth - MENU_WIDTH - 8);
  const clampedY = Math.min(position.y, window.innerHeight - MENU_HEIGHT - 8);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Block context menu"
      className={cn(
        "fixed z-[70] min-w-[180px] rounded-lg border border-border",
        "bg-popover p-1 shadow-lg text-popover-foreground",
      )}
      style={{ top: clampedY, left: clampedX }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ContextMenu component
// ---------------------------------------------------------------------------

export function ContextMenu({ children }: { children: ReactNode }): React.JSX.Element {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ x: 0, y: 0 });
  // The block targeted by right-click (may differ from selectedBlockId)
  const [contextBlockId, setContextBlockId] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setContextBlockId(null);
  }, []);

  // Right-click handler — find the nearest [data-block-id] ancestor
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const blockEl = target.closest<HTMLElement>("[data-block-id]");
      if (!blockEl) return; // no block under cursor — let browser default through
      e.preventDefault();
      const id = blockEl.dataset.blockId ?? null;
      setContextBlockId(id);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Menu actions
  // -------------------------------------------------------------------------

  const handleCopy = useCallback(() => {
    if (!contextBlockId) return;
    const block = blocks.find((b) => b.id === contextBlockId);
    if (!block) return;
    navigator.clipboard.writeText(JSON.stringify(block)).catch(() => {
      // clipboard not available in some iframe/sandboxed contexts — fail silently
    });
    closeMenu();
  }, [contextBlockId, blocks, closeMenu]);

  const handleDuplicate = useCallback(() => {
    if (!contextBlockId) return;
    setBlocks(duplicateBlock(blocks, contextBlockId));
    closeMenu();
  }, [contextBlockId, blocks, setBlocks, closeMenu]);

  const handleDelete = useCallback(
    (id: string | null) => {
      if (!id) return;
      removeBlock(id);
      if (selectedBlockId === id) selectBlock(null);
      closeMenu();
    },
    [selectedBlockId, removeBlock, selectBlock, closeMenu],
  );

  const handleSaveAsTemplate = useCallback(() => {
    void contextBlockId;
    closeMenu();
  }, [contextBlockId, closeMenu]);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      // Delete / Backspace — delete selected block
      if (
        !mod &&
        !e.shiftKey &&
        !e.altKey &&
        (e.key === "Delete" || e.key === "Backspace")
      ) {
        if (!selectedBlockId) return;
        e.preventDefault();
        removeBlock(selectedBlockId);
        selectBlock(null);
        return;
      }

      // Cmd+D — duplicate selected block
      if (mod && !e.shiftKey && e.key.toLowerCase() === "d") {
        if (!selectedBlockId) return;
        e.preventDefault();
        setBlocks(duplicateBlock(blocks, selectedBlockId));
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [blocks, selectedBlockId, setBlocks, selectBlock]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className="flex h-full flex-col"
      onContextMenu={handleContextMenu}
    >
      {children}

      <FloatingMenu open={menuOpen} position={menuPos} onClose={closeMenu}>
        <MenuItem label="Copy" shortcut="⌘C" onClick={handleCopy} />

        <MenuSeparator />

        <MenuItem label="Duplicate" shortcut="⌘D" onClick={handleDuplicate} />
        <MenuItem
          label="Delete"
          shortcut="⌫"
          variant="destructive"
          onClick={() => handleDelete(contextBlockId)}
        />

        <MenuSeparator />

        <MenuItem label="Save as Template" onClick={handleSaveAsTemplate} />
      </FloatingMenu>
    </div>
  );
}
