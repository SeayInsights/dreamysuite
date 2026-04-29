import { getPreset } from "./registry";

/**
 * Plays a one-shot GSAP preview animation on the block identified by blockId.
 * Clones the block element, hides the original, animates the clone, then
 * restores the original after ~1.5 s. Robust against missing presets, import
 * failures, and animation errors — visibility is always restored.
 */
export function runPreviewAnimation(blockId: string, presetId: string): void {
  const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
  if (!el || !el.parentElement) return;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-block-id");
  clone.style.pointerEvents = "none";
  el.parentElement.insertBefore(clone, el);
  el.style.visibility = "hidden";

  const restore = () => {
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

  const fallback = setTimeout(restore, 2000);

  const loader = getPreset(presetId);
  if (!loader) {
    clearTimeout(fallback);
    restore();
    return;
  }

  loader()
    .then((fn) => {
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
