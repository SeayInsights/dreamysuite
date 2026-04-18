"use client";

import { useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function GlassSlide({
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
  const activeIndex = items.findIndex((it) => it.isActive);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const indicatorIndex = hoveredIndex ?? activeIndex;

  return (
    <LayoutGroup>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 1.25rem",
          height: 56,
          fontFamily: bodyFont,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px) saturate(1.3)",
          WebkitBackdropFilter: "blur(12px) saturate(1.3)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginRight: 32,
            flexShrink: 0,
          }}
        >
          <img
            src={logo}
            alt={logoAlt}
            style={{ width: 30, height: 30, borderRadius: "50%" }}
          />
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
        </div>

        {/* Items */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              onMouseEnter={() => setHoveredIndex(i)}
              style={{
                position: "relative",
                padding: "8px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: bodyFont,
                fontSize: "0.83rem",
                letterSpacing: "0.03em",
                color: item.isActive ? accent : textColor,
                fontWeight: item.isActive ? 600 : 400,
                transition: "color 0.15s",
                zIndex: 1,
                whiteSpace: "nowrap",
              }}
            >
              {indicatorIndex === i && (
                <motion.div
                  layoutId="nav-slide-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    zIndex: -1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 32,
                  }}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </LayoutGroup>
  );
}
