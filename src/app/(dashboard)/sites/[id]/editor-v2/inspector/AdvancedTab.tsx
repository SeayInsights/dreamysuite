"use client";

import { useEditorStore } from "@/app/stores/editorStore";

export function AdvancedTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Size & Position
        </p>
        <p className="text-xs text-muted-foreground">
          Width, height, X/Y position controls
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Layout
        </p>
        <p className="text-xs text-muted-foreground">
          Flexbox, grid controls
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Responsive Overrides
        </p>
        <p className="text-xs text-muted-foreground">
          Breakpoint-specific settings for mobile, tablet, desktop
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Animations & Effects
        </p>
        <p className="text-xs text-muted-foreground">
          Transitions, transforms, entrance/exit animations
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Custom CSS
        </p>
        <p className="text-xs text-muted-foreground">
          Custom styles, class names, inline CSS editor
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          AI Assistant
        </p>
        <p className="text-xs text-muted-foreground">
          AI-powered design suggestions and component generation
        </p>
      </div>
    </div>
  );
}
