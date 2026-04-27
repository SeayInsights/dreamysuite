"use client";

export function CountdownEditor({
  cfg,
  updateConfig,
  block,
  breakpoint,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: unknown;
  breakpoint?: unknown;
}) {
  const showRsvp = cfg.showRsvpButton === true;

  return (
    <div className="space-y-4 p-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={showRsvp}
          onChange={(e) => updateConfig({ showRsvpButton: e.target.checked })}
          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
        />
        <span className="text-xs text-foreground">Show RSVP button</span>
      </label>
    </div>
  );
}
