import { getPreset } from "./registry";

// Tracks the cancel function for any in-flight preview, keyed by block ID.
// Allows a new preview to cancel the previous one before starting.
const activeByBlock = new Map<string, () => void>();

export function runPreviewAnimation(blockId: string, presetId: string): void {
  // Cancel any previous preview for this block immediately.
  activeByBlock.get(blockId)?.();
  activeByBlock.delete(blockId);

  const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
  if (!el || !el.parentElement) return;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-block-id");
  clone.style.pointerEvents = "none";
  // Reset visibility in case the original was hidden by a previous preview
  // (cloneNode copies inline styles, which would make the clone invisible).
  clone.style.visibility = "";
  el.parentElement.insertBefore(clone, el);
  el.style.visibility = "hidden";

  let cancelled = false;

  const restore = () => {
    if (cancelled) return;
    cancelled = true;
    activeByBlock.delete(blockId);
    el.style.visibility = "";
    import("gsap")
      .then(({ gsap }) => {
        gsap.killTweensOf(clone);
        import("gsap/ScrollTrigger")
          .then(({ ScrollTrigger }) => {
            ScrollTrigger.getAll()
              .filter((t) => t.trigger === clone)
              .forEach((t) => t.kill());
          })
          .catch(() => {});
        clone.remove();
      })
      .catch(() => {
        clone.remove();
      });
  };

  activeByBlock.set(blockId, restore);

  const fallback = setTimeout(restore, 2000);

  const loader = getPreset(presetId);
  if (!loader) {
    clearTimeout(fallback);
    restore();
    return;
  }

  loader()
    .then((fn) => {
      if (cancelled) return;
      try {
        fn(clone);
      } catch {
        clearTimeout(fallback);
        restore();
        return;
      }
      clearTimeout(fallback);
      setTimeout(restore, 1500);
    })
    .catch(() => {
      clearTimeout(fallback);
      restore();
    });
}
