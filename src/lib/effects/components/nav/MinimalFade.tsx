"use client";

import { motion } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function MinimalFade({
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
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        height: 56,
        fontFamily: bodyFont,
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginRight: 40,
          flexShrink: 0,
        }}
      >
        <img
          src={logo}
          alt={logoAlt}
          style={{ width: 28, height: 28, borderRadius: "50%" }}
        />
        <span
          style={{
            fontFamily: headingFont,
            fontSize: "0.9rem",
            fontWeight: 400,
            fontStyle: "italic",
            color: brandColor,
            whiteSpace: "nowrap",
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Items */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            type="button"
            onClick={item.onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={{
              padding: "8px 14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: bodyFont,
              fontSize: "0.83rem",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              color: item.isActive ? accent : textColor,
              fontWeight: item.isActive ? 600 : 400,
              opacity: item.isActive ? 1 : 0.65,
              transition: "color 0.25s, opacity 0.25s, font-weight 0.25s",
            }}
          >
            {item.label}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
