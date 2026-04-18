"use client";

import type { NavStyleProps } from "../../types";

const shimmerKeyframes = `
@keyframes glass-morph-shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

export default function GlassMorph({
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
    <>
      <style>{shimmerKeyframes}</style>
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "8px 1.25rem",
          fontFamily: bodyFont,
          background: "transparent",
        }}
      >
        {/* Shimmer border wrapper */}
        <div
          style={{
            position: "relative",
            borderRadius: 999,
            padding: 1,
            background: `linear-gradient(90deg, transparent 0%, ${accent}44 25%, rgba(255,255,255,0.4) 50%, ${accent}44 75%, transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "glass-morph-shimmer 4s ease infinite",
          }}
        >
          {/* Glass container */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              borderRadius: 999,
              padding: "0 6px",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(16px) saturate(1.6)",
              WebkitBackdropFilter: "blur(16px) saturate(1.6)",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px 8px 8px",
                borderRight: "1px solid rgba(255,255,255,0.12)",
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              <img
                src={logo}
                alt={logoAlt}
                style={{ width: 26, height: 26, borderRadius: "50%" }}
              />
              <span
                style={{
                  fontFamily: headingFont,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: brandColor,
                  whiteSpace: "nowrap",
                }}
              >
                {brandName}
              </span>
            </div>

            {/* Items */}
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                style={{
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: bodyFont,
                  fontSize: "0.82rem",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                  color: item.isActive ? accent : textColor,
                  fontWeight: item.isActive ? 600 : 400,
                  textShadow: item.isActive
                    ? `0 0 12px ${accent}66`
                    : "none",
                  transition: "color 0.2s, text-shadow 0.2s",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
