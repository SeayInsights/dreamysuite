"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function GlassDropdown({
  items,
  logo,
  logoAlt,
  accent,
  bg,
  textColor,
  brandColor,
  headingFont,
  bodyFont,
  brandName,
}: NavStyleProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const leave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        height: 56,
        fontFamily: bodyFont,
        position: "relative",
        background: "transparent",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={logo}
          alt={logoAlt}
          style={{ width: 32, height: 32, borderRadius: "50%" }}
        />
        <span
          style={{
            fontFamily: headingFont,
            fontSize: "0.95rem",
            fontWeight: 500,
            color: brandColor,
            letterSpacing: "0.01em",
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Hamburger + Dropdown zone */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        {/* Hamburger button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 5,
            width: 36,
            alignItems: "flex-end",
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{
                display: "block",
                height: 2,
                borderRadius: 1,
                background: brandColor,
                transformOrigin: "center",
              }}
              animate={
                open
                  ? i === 0
                    ? { width: 20, rotate: 45, y: 7 }
                    : i === 1
                      ? { width: 20, opacity: 0 }
                      : { width: 20, rotate: -45, y: -7 }
                  : {
                      width: i === 1 ? 16 : 20,
                      rotate: 0,
                      y: 0,
                      opacity: 1,
                    }
              }
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          ))}
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                minWidth: 180,
                padding: "8px 0",
                borderRadius: 14,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(16px) saturate(1.4)",
                WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3)",
                zIndex: 50,
              }}
            >
              {items.map((item, i) => (
                <motion.button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.04,
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: bodyFont,
                    fontSize: "0.85rem",
                    letterSpacing: "0.02em",
                    color: item.isActive ? accent : textColor,
                    fontWeight: item.isActive ? 600 : 400,
                    transition: "color 0.15s, background 0.15s",
                  }}
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: accent,
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
