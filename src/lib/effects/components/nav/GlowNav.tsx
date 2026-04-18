"use client";

import { useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function GlowNav({
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
  const glowIndex = hoveredIndex ?? activeIndex;

  return (
    <LayoutGroup>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 1.25rem",
          height: 56,
          fontFamily: bodyFont,
          background: "transparent",
          position: "relative",
          overflow: "hidden",
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
            zIndex: 1,
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
              color: "rgba(255,255,255,0.9)",
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
                padding: "8px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: bodyFont,
                fontSize: "0.83rem",
                letterSpacing: "0.03em",
                color: item.isActive
                  ? "#fff"
                  : "rgba(255,255,255,0.55)",
                fontWeight: item.isActive ? 600 : 400,
                transition: "color 0.2s",
                zIndex: 1,
                whiteSpace: "nowrap",
              }}
            >
              {/* Glow orb */}
              {glowIndex === i && (
                <motion.div
                  layoutId="nav-glow-orb"
                  style={{
                    position: "absolute",
                    inset: "-8px -12px",
                    borderRadius: "50%",
                    background: accent,
                    opacity: 0.18,
                    filter: "blur(18px)",
                    zIndex: -1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
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
