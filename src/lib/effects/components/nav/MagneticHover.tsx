"use client";
import { motion } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function MagneticHover({
  items,
  logo,
  logoAlt,
  accent,
  textColor,
  brandColor,
  headingFont,
  bodyFont,
  brandName,
  compact,
}: NavStyleProps) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: compact ? "0 0.5rem" : "0 1.25rem",
        height: compact ? 44 : 56,
        fontFamily: bodyFont,
        background: "transparent",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? 6 : 10,
          marginRight: compact ? 12 : 32,
          flexShrink: 0,
        }}
      >
        <img
          src={logo}
          alt={logoAlt}
          width={compact ? 22 : 30}
          height={compact ? 22 : 30}
          style={{ borderRadius: "50%" }}
        />
        {!compact && (
          <span
            style={{
              fontFamily: headingFont,
              fontSize: "0.95rem",
              fontWeight: 500,
              color: brandColor,
              whiteSpace: "nowrap",
            }}
          >
            {brandName}
          </span>
        )}
      </div>

      {/* Items */}
      <div
        style={{ display: "flex", alignItems: "center", gap: compact ? 0 : 4 }}
      >
        {items.map((item) => (
          <motion.button
            key={item.label}
            type="button"
            onClick={item.onClick}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            style={{
              padding: compact ? "6px 8px" : "8px 14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: bodyFont,
              fontSize: compact ? "0.72rem" : "0.83rem",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              color: item.isActive ? accent : textColor,
              fontWeight: item.isActive ? 600 : 400,
              transform: item.isActive ? "translateY(-1px)" : undefined,
              borderBottom: item.isActive
                ? `2px solid ${accent}`
                : "2px solid transparent",
              boxShadow: item.isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {item.label}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
