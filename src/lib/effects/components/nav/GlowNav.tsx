"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, LayoutGroup } from "motion/react";
import type { NavStyleProps } from "../../types";

export default function GlowNav({
  items,
  logo,
  logoAlt,
  accent,
  headingFont,
  bodyFont,
  brandName,
  compact,
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
          padding: compact ? "0 0.5rem" : "0 1.25rem",
          height: compact ? 44 : 56,
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
            gap: compact ? 6 : 10,
            marginRight: compact ? 12 : 32,
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <Image
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
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {brandName}
            </span>
          )}
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
                padding: compact ? "6px 8px" : "8px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: bodyFont,
                fontSize: compact ? "0.72rem" : "0.83rem",
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
