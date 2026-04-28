"use client";

import { useEditorStore } from "@/app/stores/editorStore";

export function DesignTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-4 p-4">
      {/* Colors & Backgrounds */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Colors & Backgrounds
        </p>
        <p className="text-xs text-muted-foreground">
          Page background color, background images, theme colors, opacity controls
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          (Migrated from StyleTab: bgColor, bgImage, bgImageOpacity, bgImageBleed, themeTokens, pageBgDisabled)
        </p>
      </div>

      {/* Typography */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Typography
        </p>
        <p className="text-xs text-muted-foreground">
          Font family, font size, line height, font weight, text alignment, text color
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          (Migrated from StyleTab + ContentTab: font properties, text alignment, color overrides)
        </p>
      </div>

      {/* Spacing */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Spacing
        </p>
        <p className="text-xs text-muted-foreground">
          Padding, margins, gap between elements, content width constraints
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          (Migrated from StyleTab + LayoutTab: marginLeft, marginRight, marginTop, marginBottom, padding controls)
        </p>
      </div>

      {/* Borders & Shadows */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Borders & Shadows
        </p>
        <p className="text-xs text-muted-foreground">
          Border radius, border width, border color, box shadows, outline styles
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          (Migrated from StyleTab: border and shadow properties)
        </p>
      </div>

      {/* Visibility & Opacity */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Visibility & Opacity
        </p>
        <p className="text-xs text-muted-foreground">
          Show/hide elements, opacity controls, display conditions, responsive visibility
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          (Migrated from ContentTab: visibility toggles, conditional display, opacity sliders)
        </p>
      </div>
    </div>
  );
}
